import type { MoveCoordinator } from "@/session/moveCoordinator";
import type { LayoutContextType } from "@/context/LayoutContext";
import type { Scenario, ScenarioMove } from "@/dev/scenarios";
import { getScenario, getScenarioDelay } from "@/dev/scenarios";
import { runScriptedPlaceFromWell } from "@/dev/scriptedPlaceFromWell";
import {
  Direction,
  findSlotForSpace,
  type Coord,
  type EngineResult,
  type GameState,
} from "@/engine";
import type { PieceAnimation } from "@/types/animation";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useCallback, useEffect, useRef } from "react";

type Args = {
  moves: MoveCoordinator;
  beginPieceDrag: (pieceId: string) => boolean;
  returnPieceToWell: (pieceId: string) => void;
  scenarioParam: string | undefined;
  showLoadingScreen: boolean;
  gameState: Pick<GameState, "board" | "status" | "turnCount">;
  loadScenario: (scenario: Scenario) => ScenarioMove[];
  layout: Pick<LayoutContextType, "slots" | "spaces">;
  pieceAnims: Record<string, PieceAnimation>;
  dropPiece: (slotCoord: Coord, pieceId: string) => EngineResult;
  setMoveInProgress: Dispatch<SetStateAction<boolean>>;
  pullRef: MutableRefObject<((direction: Direction) => void) | null>;
};

/**
 * Dev / tutorial: load a scripted {@link Scenario} from the route and play
 * queued moves (drops + gravity) on a timer.
 */
export function useScenarioPlayback({
  moves,
  beginPieceDrag,
  returnPieceToWell,
  scenarioParam,
  showLoadingScreen,
  gameState,
  loadScenario,
  layout,
  pieceAnims,
  dropPiece,
  setMoveInProgress,
  pullRef,
}: Args): void {
  const moveQueueRef = useRef<ScenarioMove[] | null>(null);

  useEffect(() => {
    moveQueueRef.current = null;
    if (!scenarioParam) return;
    const scenarioData = getScenario(scenarioParam);
    if (!scenarioData) return;
    moveQueueRef.current = loadScenario(scenarioData);
  }, [scenarioParam, loadScenario]);

  const playNextMove = useCallback(() => {
    const queue = moveQueueRef.current;
    if (!queue || queue.length === 0) return;
    if (gameState.status === "finished") return;

    const move = queue.shift();
    if (!move) return;

    if (move.type === "gravity") {
      pullRef.current?.(move.direction);
      return;
    }

    const { targetSpace, pieceId } = move;
    const slotCoord = findSlotForSpace(gameState.board, targetSpace);
    if (!slotCoord) return;

    runScriptedPlaceFromWell({
      moves, beginPieceDrag, returnPieceToWell,
      board: gameState.board,
      slotCoord,
      pieceId,
      layout,
      pieceAnims,
              setMoveInProgress,
          dropPiece,
    });
  }, [
    moves, beginPieceDrag, returnPieceToWell,
    gameState.board,
    gameState.status,
    pieceAnims,
    layout,
    dropPiece,
        setMoveInProgress,
      pullRef,
  ]);

  useEffect(() => {
    if (showLoadingScreen) return;
    const queue = moveQueueRef.current;
    if (!queue || queue.length === 0) return;
    if (gameState.status === "finished") return;

    const scenario = scenarioParam ? getScenario(scenarioParam) : null;
    const delayMs = scenario ? getScenarioDelay(scenario) : 1200;

    return moves.schedule(playNextMove, delayMs);
  }, [
    moves,
    showLoadingScreen,
    gameState.turnCount,
    gameState.status,
    scenarioParam,
    playNextMove,
  ]);
}
