import { animatePieceSlotThroughSpaceDrop } from "@/animations/pieceSlotThroughSpaceDrop";
import { GameElements } from "@/constants";
import {
  TURN_CHANGE_COMMIT_DELAY_MS,
  TURN_CHANGE_SETTLE_BUFFER_MS,
} from "@/constants/logic";
import type { LayoutContextType } from "@/context/LayoutContext";
import {
  coordToKey,
  resolveSlotDrop,
  type Coord,
  type EngineResult,
} from "@/engine";
import type { PieceAnimation } from "@/types/animation";
import type { Dispatch, SetStateAction } from "react";
import type { MoveCoordinator } from "@/session/moveCoordinator";

type LayoutSlice = Pick<LayoutContextType, "slots" | "spaces">;

type ScriptedPlaceArgs = {
  moves: MoveCoordinator;
  beginPieceDrag: (pieceId: string) => boolean;
  returnPieceToWell: (pieceId: string) => void;
  board: Readonly<Record<string, string>>;
  slotCoord: Coord;
  pieceId: string;
  layout: LayoutSlice;
  pieceAnims: Record<string, PieceAnimation>;
  setMoveInProgress: Dispatch<SetStateAction<boolean>>;
  dropPiece: (slotCoord: Coord, pieceId: string) => EngineResult;
};

/**
 * Queues the same animated slot drop used by {@link dev/useScenarioPlayback}
 * for a scripted `place` move (piece leaves well, drops through slot).
 * Returns false if layout or resolution is not ready.
 */
export function runScriptedPlaceFromWell({
  moves,
  beginPieceDrag,
  returnPieceToWell,
  board,
  slotCoord,
  pieceId,
  layout,
  pieceAnims,
  setMoveInProgress,
  dropPiece,
}: ScriptedPlaceArgs): boolean {
  const landing = resolveSlotDrop(board, slotCoord);
  if (!landing) return false;

  const anim = pieceAnims[pieceId];
  if (!anim) return false;

  const slotKey = coordToKey(slotCoord);
  const landingKey = coordToKey(landing);
  const slotLayout = layout.slots[slotKey];
  const spaceLayout = layout.spaces[landingKey];
  if (!slotLayout || !spaceLayout) return false;

  if (!beginPieceDrag(pieceId)) return false;
  setMoveInProgress(true);

  animatePieceSlotThroughSpaceDrop(anim, slotLayout, spaceLayout, {
    ensureHeldPresentation: true,
  });

  moves.schedule(() => {
    anim.zIndex.value = GameElements.PIECE_BOARD_ZINDEX;
    const result = dropPiece(slotCoord, pieceId);
    if (!result.events.some(event => event.type === "piece_placed")) returnPieceToWell(pieceId);
  }, TURN_CHANGE_COMMIT_DELAY_MS);
  moves.schedule(() => { moves.finish(); setMoveInProgress(false); }, TURN_CHANGE_COMMIT_DELAY_MS + TURN_CHANGE_SETTLE_BUFFER_MS);

  return true;
}
