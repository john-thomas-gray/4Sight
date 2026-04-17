import { animateWinnerPiece } from "@/animations/animateWinner";
import { TIE_WIN_SECOND_CASCADE_BEAT_MS } from "@/constants/logic";
import type { GameState } from "@/engine";
import {
  detectWin,
  pieceStaggerDelaysForSyncedWinCascades,
  Team,
  winningLinesForTeam,
  WINNER_MOTION_APEX_MS,
} from "@/engine";
import { gameStateToSerializable, saveSession } from "@/storage";
import type { PersistedSessionState } from "@/storage";
import { WINNER_V0, WINNER_V1, type PieceAnimation } from "@/types/animation";
import { PieceStatus, type PieceStatusMap } from "@/types/pieceStatus";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useEffect, useRef } from "react";

type Args = {
  gameState: GameState;
  pieceStatusMap: PieceStatusMap;
  wellPieceLocations: Record<string, string>;
  setPieceStatusMap: Dispatch<SetStateAction<PieceStatusMap>>;
  setNextStartingTeam: Dispatch<SetStateAction<Team>>;
  pieceAnimsRef: MutableRefObject<Record<string, PieceAnimation>>;
  winnerCascadeKeyRef: MutableRefObject<string | null>;
  winningDropPieceIdsRef: MutableRefObject<Set<string>>;
  resetCommitTimeoutRef: MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>;
};

/**
 * Session-adjacent reactions kept out of {@link GameSessionContext} so the
 * provider file stays state + imperative API, not long effect graphs.
 */
export function useGameSessionSideEffects({
  gameState,
  pieceStatusMap,
  wellPieceLocations,
  setPieceStatusMap,
  setNextStartingTeam,
  pieceAnimsRef,
  winnerCascadeKeyRef,
  winningDropPieceIdsRef,
  resetCommitTimeoutRef,
}: Args): void {
  useEffect(() => {
    if (gameState.status !== "finished" || !gameState.winner) return;
    setNextStartingTeam(gameState.winner);
  }, [gameState.status, gameState.winner, setNextStartingTeam]);

  useEffect(() => {
    return () => {
      if (resetCommitTimeoutRef.current)
        clearTimeout(resetCommitTimeoutRef.current);
    };
  }, [resetCommitTimeoutRef]);

  useEffect(() => {
    if (gameState.status !== "finished") {
      winnerCascadeKeyRef.current = null;
      return;
    }
    if (!gameState.winner && !gameState.tie) {
      winnerCascadeKeyRef.current = null;
      return;
    }

    const winResult = detectWin(gameState.board, gameState.pieces);
    const preferredAnchors = [...winningDropPieceIdsRef.current];
    const cascadeEntryMs = WINNER_V1 + WINNER_V0;
    const apexMs = WINNER_MOTION_APEX_MS;

    if (gameState.tie) {
      const puller = gameState.currentTeam;
      const other = puller === Team.One ? Team.Two : Team.One;
      const linesPuller = winningLinesForTeam(
        winResult.lines,
        gameState.pieces,
        puller,
      );
      const linesOther = winningLinesForTeam(
        winResult.lines,
        gameState.pieces,
        other,
      );
      if (linesPuller.length === 0 && linesOther.length === 0) return;

      const lineSigs = [...linesPuller, ...linesOther]
        .map((line) => line.pieceIds.join(":"))
        .sort()
        .join("|");
      const cascadeKey = `tie:${gameState.turnCount}:${lineSigs}`;
      if (winnerCascadeKeyRef.current === cascadeKey) return;
      winnerCascadeKeyRef.current = cascadeKey;

      const delaysPuller = pieceStaggerDelaysForSyncedWinCascades(
        winResult.lines,
        gameState.pieces,
        puller,
        preferredAnchors,
      );
      const delaysOther = pieceStaggerDelaysForSyncedWinCascades(
        winResult.lines,
        gameState.pieces,
        other,
        preferredAnchors,
      );

      let maxPullerStart = 0;
      for (const d of delaysPuller.values()) {
        maxPullerStart = Math.max(maxPullerStart, d);
      }
      const otherPhaseStart =
        maxPullerStart + cascadeEntryMs + TIE_WIN_SECOND_CASCADE_BEAT_MS;

      const tieRevealTimeouts: ReturnType<typeof setTimeout>[] = [];

      for (const [pieceId, delayMs] of delaysPuller) {
        const anim = pieceAnimsRef.current[pieceId];
        if (anim) {
          animateWinnerPiece(anim, delayMs, { skipColor: true });
        }
        tieRevealTimeouts.push(
          setTimeout(() => {
            setPieceStatusMap((prev) => ({
              ...prev,
              [pieceId]: PieceStatus.winner,
            }));
          }, delayMs + apexMs),
        );
      }
      for (const [pieceId, delayMs] of delaysOther) {
        const t = otherPhaseStart + delayMs;
        const anim = pieceAnimsRef.current[pieceId];
        if (anim) {
          animateWinnerPiece(anim, t, { skipColor: true });
        }
        tieRevealTimeouts.push(
          setTimeout(() => {
            setPieceStatusMap((prev) => ({
              ...prev,
              [pieceId]: PieceStatus.winner,
            }));
          }, t + apexMs),
        );
      }

      return () => {
        for (const tid of tieRevealTimeouts) clearTimeout(tid);
        winnerCascadeKeyRef.current = null;
      };
    }

    const winnerTeam = gameState.winner;
    if (!winnerTeam) return;

    const winningLines = winningLinesForTeam(
      winResult.lines,
      gameState.pieces,
      winnerTeam,
    );
    if (winningLines.length === 0) return;

    const cascadeIds = [
      ...new Set(winningLines.flatMap((line) => [...line.pieceIds])),
    ];

    const lineSigs = winningLines
      .map((line) => line.pieceIds.join(":"))
      .sort()
      .join("|");
    const cascadeKey = `${gameState.turnCount}:${lineSigs}`;
    if (winnerCascadeKeyRef.current === cascadeKey) return;
    winnerCascadeKeyRef.current = cascadeKey;

    const delays = pieceStaggerDelaysForSyncedWinCascades(
      winResult.lines,
      gameState.pieces,
      winnerTeam,
      preferredAnchors,
    );
    for (const [pieceId, delayMs] of delays) {
      const anim = pieceAnimsRef.current[pieceId];
      if (anim) {
        animateWinnerPiece(anim, delayMs);
      }
    }

    setPieceStatusMap((prev) => {
      const next = { ...prev };
      for (const pieceId of cascadeIds) {
        next[pieceId] = PieceStatus.winner;
      }
      return next;
    });
  }, [
    gameState.status,
    gameState.winner,
    gameState.tie,
    gameState.currentTeam,
    gameState.turnCount,
    gameState.board,
    gameState.pieces,
    setPieceStatusMap,
    pieceAnimsRef,
    winnerCascadeKeyRef,
    winningDropPieceIdsRef,
  ]);

  const turnCountRef = useRef(gameState.turnCount);
  useEffect(() => {
    if (gameState.turnCount === turnCountRef.current) return;
    turnCountRef.current = gameState.turnCount;

    const session: PersistedSessionState = {
      game: gameStateToSerializable(gameState),
      pieceStatusMap,
      wellPieceLocations,
    };
    saveSession(session);
  }, [gameState, pieceStatusMap, wellPieceLocations]);
}
