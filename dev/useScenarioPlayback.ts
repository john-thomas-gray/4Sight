import { animatePieceSlotThroughSpaceDrop } from "@/animations/pieceSlotThroughSpaceDrop";
import type { LayoutContextType } from "@/context/LayoutContext";
import { GameElements } from "@/constants";
import {
  TURN_CHANGE_COMMIT_DELAY_MS,
  TURN_CHANGE_SETTLE_BUFFER_MS,
} from "@/constants/logic";
import type { Scenario, ScenarioMove } from "@/dev/scenarios";
import { getScenario, getScenarioDelay } from "@/dev/scenarios";
import {
  coordToKey,
  Direction,
  findSlotForSpace,
  resolveSlotDrop,
  type Coord,
  type EngineResult,
  type GameState,
} from "@/engine";
import type { PieceAnimation } from "@/types/animation";
import { PieceStatus, type PieceStatusMap } from "@/types/pieceStatus";
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
  const scenarioLoadedRef = useRef(false);

  useEffect(() => {
    if (!scenarioParam || scenarioLoadedRef.current) return;
    const scenarioData = getScenario(scenarioParam);
    if (!scenarioData) return;
    scenarioLoadedRef.current = true;
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

    const landing = resolveSlotDrop(gameState.board, slotCoord);
    if (!landing) return;

    const anim = pieceAnims[pieceId];
    if (!anim) return;

    const slotKey = coordToKey(slotCoord);
    const landingKey = coordToKey(landing);
    const slotLayout = layout.slots[slotKey];
    const spaceLayout = layout.spaces[landingKey];
    if (!slotLayout || !spaceLayout) return;

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
