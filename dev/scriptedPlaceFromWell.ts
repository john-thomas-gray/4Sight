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
import { PieceStatus, type PieceStatusMap } from "@/types/pieceStatus";
import type { Dispatch, SetStateAction } from "react";

type LayoutSlice = Pick<LayoutContextType, "slots" | "spaces">;

export type ScriptedPlaceArgs = {
  board: Readonly<Record<string, string>>;
  slotCoord: Coord;
  pieceId: string;
  layout: LayoutSlice;
  pieceAnims: Record<string, PieceAnimation>;
  setWellPieceLocations: Dispatch<SetStateAction<Record<string, string>>>;
  setPieceStatusMap: Dispatch<SetStateAction<PieceStatusMap>>;
  setMoveInProgress: Dispatch<SetStateAction<boolean>>;
  setMoveInProgressDelayed: (value: boolean, delayMs: number) => void;
  dropPiece: (slotCoord: Coord, pieceId: string) => EngineResult;
};

/**
 * Queues the same animated slot drop used by {@link dev/useScenarioPlayback}
 * for a scripted `place` move (piece leaves well, drops through slot).
 * Returns false if layout or resolution is not ready.
 */
export function runScriptedPlaceFromWell({
  board,
  slotCoord,
  pieceId,
  layout,
  pieceAnims,
  setWellPieceLocations,
  setPieceStatusMap,
  setMoveInProgress,
  setMoveInProgressDelayed,
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

  setWellPieceLocations((prev) => {
    const next = { ...prev };
    for (const [wellId, pid] of Object.entries(next)) {
      if (pid === pieceId) {
        delete next[wellId];
        break;
      }
    }
    return next;
  });
  setPieceStatusMap((prev) => ({ ...prev, [pieceId]: PieceStatus.isHeld }));
  setMoveInProgress(true);

  animatePieceSlotThroughSpaceDrop(anim, slotLayout, spaceLayout, {
    ensureHeldPresentation: true,
  });

  setTimeout(() => {
    anim.zIndex.value = GameElements.PIECE_BOARD_ZINDEX;
    dropPiece(slotCoord, pieceId);
    setPieceStatusMap((prev) => ({
      ...prev,
      [pieceId]: PieceStatus.onBoard,
    }));
  }, TURN_CHANGE_COMMIT_DELAY_MS);
  setMoveInProgressDelayed(
    false,
    TURN_CHANGE_COMMIT_DELAY_MS + TURN_CHANGE_SETTLE_BUFFER_MS,
  );
  return true;
}
