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
import type { PieceStatusMap } from "@/types/pieceStatus";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useCallback, useEffect, useRef } from "react";

type Args = {
  scenarioParam: string | undefined;
  showLoadingScreen: boolean;
  gameState: Pick<GameState, "board" | "status" | "turnCount">;
  loadScenario: (scenario: Scenario) => ScenarioMove[];
  layout: Pick<LayoutContextType, "slots" | "spaces">;
  pieceAnims: Record<string, PieceAnimation>;
  setWellPieceLocations: Dispatch<SetStateAction<Record<string, string>>>;
  setPieceStatusMap: Dispatch<SetStateAction<PieceStatusMap>>;
  dropPiece: (slotCoord: Coord, pieceId: string) => EngineResult;
  setMoveInProgress: Dispatch<SetStateAction<boolean>>;
  setMoveInProgressDelayed: (value: boolean, delayMs: number) => void;
  pullRef: MutableRefObject<((direction: Direction) => void) | null>;
};

/**
 * Dev / tutorial: load a scripted {@link Scenario} from the route and play
 * queued moves (drops + gravity) on a timer.
 */
export function useScenarioPlayback({
  scenarioParam,
  showLoadingScreen,
  gameState,
  loadScenario,
  layout,
  pieceAnims,
  setWellPieceLocations,
  setPieceStatusMap,
  dropPiece,
  setMoveInProgress,
  setMoveInProgressDelayed,
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
      board: gameState.board,
      slotCoord,
      pieceId,
      layout,
      pieceAnims,
      setWellPieceLocations,
      setPieceStatusMap,
      setMoveInProgress,
      setMoveInProgressDelayed,
      dropPiece,
    });
  }, [
    gameState.board,
    gameState.status,
    pieceAnims,
    layout.slots,
    layout.spaces,
    dropPiece,
    setPieceStatusMap,
    setWellPieceLocations,
    setMoveInProgress,
    setMoveInProgressDelayed,
    pullRef,
  ]);

  useEffect(() => {
    if (showLoadingScreen) return;
    const queue = moveQueueRef.current;
    if (!queue || queue.length === 0) return;
    if (gameState.status === "finished") return;

    const scenario = scenarioParam ? getScenario(scenarioParam) : null;
    const delayMs = scenario ? getScenarioDelay(scenario) : 1200;

    const timer = setTimeout(playNextMove, delayMs);
    return () => clearTimeout(timer);
  }, [
    showLoadingScreen,
    gameState.turnCount,
    gameState.status,
    scenarioParam,
    playNextMove,
  ]);
}
