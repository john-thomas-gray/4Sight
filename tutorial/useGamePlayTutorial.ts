import {
  TUTORIAL_STEP4_WIN_MOTION_SETTLE_MS,
  TUTORIAL_STEP8_OUTRO_MS,
} from "./constants";
import type { GameState } from "@/engine";
import { Team } from "@/engine";
import { PieceStatus, type PieceStatusMap } from "@/types/pieceStatus";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  countPiecesOnBoard,
  getResolvedGamePlayTutorialStepParam,
  resolveGamePlayTutorialStep,
  TUTORIAL_STEP_ONE_FOCUS_PIECE_ID,
} from "./gamePlayTutorialSteps";
import type {
  TutorialCompletionContext,
  TutorialShowBannerContext,
} from "./gamePlayTutorialTypes";

type Args = {
  scenarioParam: string | undefined;
  tutorialStepParam: string | undefined;
  pieceStatusMap: PieceStatusMap;
  gameStateForTutorialBanner: Pick<
    GameState,
    "status" | "currentTeam" | "board" | "turnCount" | "winner"
  >;
  applyTutorialStepTwoWells: () => void;
  /** Loads {@link dev/scenarios} `tutorialNearWin` (tutorial step 4). */
  installTutorialNearWinBoard: () => void;
  /** Loads {@link dev/scenarios} `tutorialGravityNearWin` after the tutorial win. */
  installtutorialGravityNearWinBoard: () => void;
  /** Loads {@link dev/scenarios} `tutorialTightSpot` (tutorial step 6). */
  installTutorialTightSpotBoard: () => void;
  /** After step 8: new game and navigate to `/gamePlay` without tutorial params. */
  finishTutorialAndPlay: () => Promise<void>;
  setSlotDropHintActive: (active: boolean) => void;
  setTutorialWellPieceIdlePulseActive: (active: boolean) => void;
};

/**
 * Wires tutorial steps defined in {@link ./gamePlayTutorialSteps} to game session + UI.
 * Screen stays responsible only for rendering the banner from returned flags.
 */
export function useGamePlayTutorial({
  scenarioParam,
  tutorialStepParam,
  pieceStatusMap,
  gameStateForTutorialBanner,
  applyTutorialStepTwoWells,
  installTutorialNearWinBoard,
  installtutorialGravityNearWinBoard,
  installTutorialTightSpotBoard,
  finishTutorialAndPlay,
  setSlotDropHintActive,
  setTutorialWellPieceIdlePulseActive,
}: Args) {
  const router = useRouter();
  const [tutorialUiStep, setTutorialUiStep] = useState(
    () => tutorialStepParam ?? "1",
  );

  const prevScenarioRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const prev = prevScenarioRef.current;
    prevScenarioRef.current = scenarioParam;
    if (
      scenarioParam === "tutorialStep1" &&
      prev !== undefined &&
      prev !== "tutorialStep1"
    ) {
      setTutorialUiStep(tutorialStepParam ?? "1");
    }
  }, [scenarioParam, tutorialStepParam]);

  const resolvedTutorialStepParam = useMemo(
    () =>
      getResolvedGamePlayTutorialStepParam(
        scenarioParam,
        tutorialStepParam,
        tutorialUiStep,
      ),
    [scenarioParam, tutorialStepParam, tutorialUiStep],
  );

  const activeStep = useMemo(
    () => resolveGamePlayTutorialStep(scenarioParam, resolvedTutorialStepParam),
    [scenarioParam, resolvedTutorialStepParam],
  );

  const completionStartedRef = useRef(false);
  const [gravityBannerBaselines, setGravityBannerBaselines] = useState<{
    turn: number;
    onBoard: number;
  } | null>(null);
  const [defenseBannerBaselines, setDefenseBannerBaselines] = useState<{
    turn: number;
    onBoard: number;
  } | null>(null);
  const [tutorialStep8OutroComplete, setTutorialStep8OutroComplete] =
    useState(false);
  const [tutorialStep4WinHoldComplete, setTutorialStep4WinHoldComplete] =
    useState(false);
  const step4WinMotionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const step8OutroTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const installNearWinRef = useRef(installTutorialNearWinBoard);
  installNearWinRef.current = installTutorialNearWinBoard;
  const installGravityPrimerRef = useRef(installtutorialGravityNearWinBoard);
  installGravityPrimerRef.current = installtutorialGravityNearWinBoard;
  const installTightSpotRef = useRef(installTutorialTightSpotBoard);
  installTightSpotRef.current = installTutorialTightSpotBoard;
  const finishTutorialRef = useRef(finishTutorialAndPlay);
  finishTutorialRef.current = finishTutorialAndPlay;

  useEffect(() => {
    completionStartedRef.current = false;
    if (activeStep?.id !== "tutorialStep5") {
      setGravityBannerBaselines(null);
    }
    if (activeStep?.id !== "tutorialStep6") {
      setDefenseBannerBaselines(null);
    }
    if (activeStep?.id !== "tutorialStep8") {
      setTutorialStep8OutroComplete(false);
    }
  }, [activeStep?.id]);

  useEffect(() => {
    const clear = () => {
      if (step8OutroTimerRef.current) {
        clearTimeout(step8OutroTimerRef.current);
        step8OutroTimerRef.current = null;
      }
    };
    if (!scenarioParam?.startsWith("tutorial")) {
      clear();
      return clear;
    }
    if (resolvedTutorialStepParam !== "8") {
      clear();
      return clear;
    }
    if (step8OutroTimerRef.current !== null) return clear;

    step8OutroTimerRef.current = setTimeout(() => {
      step8OutroTimerRef.current = null;
      setTutorialStep8OutroComplete(true);
    }, TUTORIAL_STEP8_OUTRO_MS);

    return clear;
  }, [resolvedTutorialStepParam, scenarioParam]);

  useEffect(() => {
    if (
      !scenarioParam?.startsWith("tutorial") ||
      resolvedTutorialStepParam !== "4"
    ) {
      setTutorialStep4WinHoldComplete(false);
      return;
    }
    if (gameStateForTutorialBanner.status === "playing") {
      setTutorialStep4WinHoldComplete(false);
    }
  }, [
    scenarioParam,
    resolvedTutorialStepParam,
    gameStateForTutorialBanner.status,
  ]);

  useEffect(() => {
    const clearTimer = () => {
      if (step4WinMotionTimerRef.current) {
        clearTimeout(step4WinMotionTimerRef.current);
        step4WinMotionTimerRef.current = null;
      }
    };

    if (
      !scenarioParam?.startsWith("tutorial") ||
      resolvedTutorialStepParam !== "4"
    ) {
      clearTimer();
      return clearTimer;
    }
    if (
      gameStateForTutorialBanner.status !== "finished" ||
      gameStateForTutorialBanner.winner !== Team.One
    ) {
      clearTimer();
      return clearTimer;
    }
    if (tutorialStep4WinHoldComplete) {
      clearTimer();
      return clearTimer;
    }
    if (step4WinMotionTimerRef.current !== null) return clearTimer;

    step4WinMotionTimerRef.current = setTimeout(() => {
      step4WinMotionTimerRef.current = null;
      setTutorialStep4WinHoldComplete(true);
    }, TUTORIAL_STEP4_WIN_MOTION_SETTLE_MS);

    return clearTimer;
  }, [
    scenarioParam,
    resolvedTutorialStepParam,
    gameStateForTutorialBanner.status,
    gameStateForTutorialBanner.winner,
    tutorialStep4WinHoldComplete,
  ]);

  const tutorialShowBannerContext: TutorialShowBannerContext = useMemo(
    () => ({
      stepTwoBlackStacksOnWhiteComplete:
        !!scenarioParam?.startsWith("tutorial") &&
        resolvedTutorialStepParam === "2" &&
        gameStateForTutorialBanner.status === "playing" &&
        gameStateForTutorialBanner.currentTeam === Team.One &&
        Object.keys(gameStateForTutorialBanner.board).length >= 2 &&
        pieceStatusMap[TUTORIAL_STEP_ONE_FOCUS_PIECE_ID] ===
          PieceStatus.onBoard,
      winLessonBannerReady:
        !!scenarioParam?.startsWith("tutorial") &&
        resolvedTutorialStepParam === "4" &&
        gameStateForTutorialBanner.status === "playing" &&
        gameStateForTutorialBanner.currentTeam === Team.One &&
        countPiecesOnBoard(pieceStatusMap) >= 9,
      gravityLessonBannerReady:
        !!scenarioParam?.startsWith("tutorial") &&
        resolvedTutorialStepParam === "5" &&
        gameStateForTutorialBanner.status === "playing" &&
        gameStateForTutorialBanner.currentTeam === Team.One &&
        Object.keys(gameStateForTutorialBanner.board).length >= 1,
      defenseLessonBannerReady:
        !!scenarioParam?.startsWith("tutorial") &&
        resolvedTutorialStepParam === "6" &&
        gameStateForTutorialBanner.status === "playing" &&
        gameStateForTutorialBanner.currentTeam === Team.One &&
        Object.keys(gameStateForTutorialBanner.board).length >= 10,
      shakeLessonBannerReady:
        !!scenarioParam?.startsWith("tutorial") &&
        resolvedTutorialStepParam === "7" &&
        gameStateForTutorialBanner.status === "playing",
      tutorialStep8BannerReady:
        !!scenarioParam?.startsWith("tutorial") &&
        resolvedTutorialStepParam === "8" &&
        gameStateForTutorialBanner.status === "playing" &&
        Object.keys(gameStateForTutorialBanner.board).length === 0,
    }),
    [
      scenarioParam,
      resolvedTutorialStepParam,
      gameStateForTutorialBanner.status,
      gameStateForTutorialBanner.currentTeam,
      gameStateForTutorialBanner.board,
      pieceStatusMap,
    ],
  );

  const gravityBannerVisible = useMemo(
    () =>
      activeStep?.id === "tutorialStep5" &&
      activeStep.showBanner(pieceStatusMap, tutorialShowBannerContext),
    [activeStep, pieceStatusMap, tutorialShowBannerContext],
  );

  useEffect(() => {
    if (!gravityBannerVisible) return;
    if (gravityBannerBaselines !== null) return;
    setGravityBannerBaselines({
      turn: gameStateForTutorialBanner.turnCount,
      onBoard: countPiecesOnBoard(pieceStatusMap),
    });
  }, [
    gravityBannerVisible,
    gravityBannerBaselines,
    gameStateForTutorialBanner.turnCount,
    pieceStatusMap,
  ]);

  const defenseBannerVisible = useMemo(
    () =>
      activeStep?.id === "tutorialStep6" &&
      activeStep.showBanner(pieceStatusMap, tutorialShowBannerContext),
    [activeStep, pieceStatusMap, tutorialShowBannerContext],
  );

  useEffect(() => {
    if (!defenseBannerVisible) return;
    if (defenseBannerBaselines !== null) return;
    setDefenseBannerBaselines({
      turn: gameStateForTutorialBanner.turnCount,
      onBoard: countPiecesOnBoard(pieceStatusMap),
    });
  }, [
    defenseBannerVisible,
    defenseBannerBaselines,
    gameStateForTutorialBanner.turnCount,
    pieceStatusMap,
  ]);

  const boardOccupiedCount = useMemo(
    () => Object.keys(gameStateForTutorialBanner.board).length,
    [gameStateForTutorialBanner.board],
  );

  const completionContext = useMemo((): TutorialCompletionContext => {
    return {
      currentTurnCount: gameStateForTutorialBanner.turnCount,
      currentStatus: gameStateForTutorialBanner.status,
      currentWinner: gameStateForTutorialBanner.winner,
      boardOccupiedCount,
      gravityLessonBannerBaselineTurn: gravityBannerBaselines?.turn ?? null,
      gravityLessonBannerBaselineOnBoardCount:
        gravityBannerBaselines?.onBoard ?? null,
      defenseLessonBannerBaselineTurn: defenseBannerBaselines?.turn ?? null,
      defenseLessonBannerBaselineOnBoardCount:
        defenseBannerBaselines?.onBoard ?? null,
      tutorialStep4WinHoldComplete,
      tutorialStep8OutroComplete,
    };
  }, [
    gameStateForTutorialBanner.turnCount,
    gameStateForTutorialBanner.status,
    gameStateForTutorialBanner.winner,
    boardOccupiedCount,
    gravityBannerBaselines,
    defenseBannerBaselines,
    tutorialStep4WinHoldComplete,
    tutorialStep8OutroComplete,
  ]);

  useEffect(() => {
    if (!activeStep) return;
    if (completionStartedRef.current) return;
    if (!activeStep.isComplete(pieceStatusMap, completionContext)) return;
    completionStartedRef.current = true;
    if (activeStep.id === "tutorialStep1") {
      applyTutorialStepTwoWells();
      setTutorialUiStep("2");
      return;
    }
    if (activeStep.id === "tutorialStep2") {
      if (scenarioParam === "tutorialStep1") {
        setTutorialUiStep("3");
      } else if (scenarioParam) {
        void router.replace(
          `/gamePlay?scenario=${scenarioParam}&tutorialStep=3` as never,
        );
      }
      return;
    }
    if (activeStep.id === "tutorialStep3") {
      installNearWinRef.current();
      if (scenarioParam === "tutorialStep1") {
        setTutorialUiStep("4");
      } else if (scenarioParam) {
        void router.replace(
          `/gamePlay?scenario=${scenarioParam}&tutorialStep=4` as never,
        );
      }
      return;
    }
    if (activeStep.id === "tutorialStep4") {
      installGravityPrimerRef.current();
      if (scenarioParam === "tutorialStep1") {
        setTutorialUiStep("5");
      } else if (scenarioParam) {
        void router.replace(
          `/gamePlay?scenario=${scenarioParam}&tutorialStep=5` as never,
        );
      }
      return;
    }
    if (activeStep.id === "tutorialStep5") {
      installTightSpotRef.current();
      if (scenarioParam === "tutorialStep1") {
        setTutorialUiStep("6");
      } else if (scenarioParam) {
        void router.replace(
          `/gamePlay?scenario=${scenarioParam}&tutorialStep=6` as never,
        );
      }
      return;
    }
    if (activeStep.id === "tutorialStep6") {
      if (scenarioParam === "tutorialStep1") {
        setTutorialUiStep("7");
      } else if (scenarioParam) {
        void router.replace(
          `/gamePlay?scenario=${scenarioParam}&tutorialStep=7` as never,
        );
      }
      return;
    }
    if (activeStep.id === "tutorialStep7") {
      if (scenarioParam === "tutorialStep1") {
        setTutorialUiStep("8");
      } else if (scenarioParam) {
        void router.replace(
          `/gamePlay?scenario=${scenarioParam}&tutorialStep=8` as never,
        );
      }
      return;
    }
    if (activeStep.id === "tutorialStep8") {
      void finishTutorialRef.current();
      return;
    }
  }, [
    activeStep,
    pieceStatusMap,
    completionContext,
    router,
    scenarioParam,
    applyTutorialStepTwoWells,
  ]);

  useEffect(() => {
    if (!activeStep) {
      setSlotDropHintActive(false);
      return;
    }
    const pulse = activeStep.slotDropHintActive(pieceStatusMap);
    setSlotDropHintActive(pulse);
    return () => setSlotDropHintActive(false);
  }, [activeStep, pieceStatusMap, setSlotDropHintActive]);

  useEffect(() => {
    if (!activeStep) {
      setTutorialWellPieceIdlePulseActive(false);
      return;
    }
    const idle = activeStep.wellPieceIdlePulseActive(pieceStatusMap);
    setTutorialWellPieceIdlePulseActive(idle);
    return () => setTutorialWellPieceIdlePulseActive(false);
  }, [activeStep, pieceStatusMap, setTutorialWellPieceIdlePulseActive]);

  const showBanner =
    !!activeStep &&
    activeStep.showBanner(pieceStatusMap, tutorialShowBannerContext);
  const bannerMessage = activeStep?.bannerMessage ?? "";

  return { showBanner, bannerMessage, resolvedTutorialStepParam };
}
