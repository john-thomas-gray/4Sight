import { useGameSession } from "@/context/GameSessionContext";
import { useLayout } from "@/context/LayoutContext";
import { useUiSelector } from "@/context/UiContext";
import { runScriptedPlaceFromWell } from "@/dev/scriptedPlaceFromWell";
import { chooseComputerMoveAsync, Direction, Team, type GameState } from "@/engine";
import { useEffect, useState, type MutableRefObject } from "react";

/** Owns thinking only. Committed move animations belong to the session coordinator. */
export function useComputerOpponent(
  enabled: boolean,
  pullRef: MutableRefObject<((direction: Direction) => void) | null>,
) {
  const { mode, gameState, positionRevision, moves, getSessionSnapshot,
    beginPieceDrag, returnPieceToWell, pieceAnims, dropPiece } = useGameSession();
  const { slots, spaces } = useLayout();
  const { moveInProgress, setMoveInProgress } = useUiSelector(ui => ({
    moveInProgress: ui.moveInProgress, setMoveInProgress: ui.setMoveInProgress,
  }));
  const [blockedPosition, setBlockedPosition] = useState<GameState | null>(null);

  useEffect(() => {
    if (!enabled || mode !== "onePlayer" || gameState.status !== "playing" ||
        gameState.currentTeam !== Team.Two || moveInProgress || moves.getPhase() !== null) return;
    let cancelled = false;
    const removeCancelListener = moves.onCancel(() => { cancelled = true; });
    const cancel = moves.schedule(() => {
      void (async () => {
        const decision = await chooseComputerMoveAsync(gameState, { isCancelled: () => cancelled });
        if (cancelled || getSessionSnapshot().gameState !== gameState || moves.getPhase() !== null) return;
        if (!decision?.move) { setBlockedPosition(gameState); return; }
        const move = decision.move;
        if (move.type === "pull") {
          pullRef.current?.(move.direction);
        } else {
          runScriptedPlaceFromWell({ moves, beginPieceDrag, returnPieceToWell,
            board: gameState.board, slotCoord: move.slot, pieceId: move.pieceId,
            layout: { slots, spaces }, pieceAnims, setMoveInProgress, dropPiece });
        }
      })();
    }, 350);
    return () => { cancelled = true; cancel(); removeCancelListener(); };
  }, [enabled, mode, gameState, positionRevision, moves, getSessionSnapshot, moveInProgress,
    slots, spaces, beginPieceDrag, returnPieceToWell, pieceAnims, setMoveInProgress, dropPiece, pullRef]);

  return { blocked: enabled && blockedPosition === gameState };
}
