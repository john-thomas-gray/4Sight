import { Team } from "@/engine";
import { PieceStatus } from "@/types/pieceStatus";
import type {
  GamePlayTutorialStep,
  TutorialCompletionContext,
  TutorialShowBannerContext,
} from "./gamePlayTutorialTypes";

/** Spare piece for step 1 — must match scenario `wellPieceLocations` value. */
export const TUTORIAL_STEP_ONE_FOCUS_PIECE_ID = "0";

const FOCUS_PIECE_TUTORIAL_STEP1 = TUTORIAL_STEP_ONE_FOCUS_PIECE_ID;

/** Deep link for step 1 — keep in sync with `dev/scenarios` `tutorialStep1`. */
export const TUTORIAL_STEP_ONE_GAMEPLAY_PATH =
  "/gamePlay?scenario=tutorialStep1&tutorialStep=1";

/** In-place tutorial uses `tutorialStep1` URL with `tutorialUiStep` 1–8. */
function matchesTutorialHandoff(
  scenario: string | undefined,
  step: string | undefined,
  query: string,
): boolean {
  if (step !== query) return false;
  return (
    scenario === "tutorialStep1" ||
    scenario === "tutorialStep2" ||
    scenario === "tutorialStep3" ||
    scenario === "tutorialStep4" ||
    scenario === "tutorialStep5" ||
    scenario === "tutorialStep6" ||
    scenario === "tutorialStep7" ||
    scenario === "tutorialStep8"
  );
}

export function countPiecesOnBoard(
  map: Readonly<Record<string, PieceStatus>>,
): number {
  let n = 0;
  for (const s of Object.values(map)) {
    if (s === PieceStatus.onBoard) n += 1;
  }
  return n;
}

const GAME_PLAY_TUTORIAL_STEPS: readonly GamePlayTutorialStep[] = [
  {
    id: "tutorialStep1",
    scenarioId: "tutorialStep1",
    tutorialStepQuery: "1",
    bannerMessage:
      "Touch the piece to pick it up. Release it over a slot to drop it into the board.",
    matchesScenario: (scenario, step) =>
      scenario === "tutorialStep1" && step === "1",
    showBanner: (map, _context?: TutorialShowBannerContext) =>
      map[FOCUS_PIECE_TUTORIAL_STEP1] !== PieceStatus.onBoard,
    slotDropHintActive: (map) =>
      map[FOCUS_PIECE_TUTORIAL_STEP1] === PieceStatus.isHeld,
    wellPieceIdlePulseActive: (map) =>
      map[FOCUS_PIECE_TUTORIAL_STEP1] === PieceStatus.inWell,
    isComplete: (map, _context?: TutorialCompletionContext) =>
      map[FOCUS_PIECE_TUTORIAL_STEP1] === PieceStatus.onBoard,
    runOnComplete: async () => {},
  },
  {
    id: "tutorialStep2",
    scenarioId: "tutorialStep2",
    tutorialStepQuery: "2",
    bannerMessage:
      "You may drop pieces from any side of the board. Pieces can be stacked in any direction.\nGive it a try!",
    matchesScenario: (scenario, step) =>
      (scenario === "tutorialStep2" && step === "2") ||
      (scenario === "tutorialStep1" && step === "2"),
    showBanner: (_map, context?: TutorialShowBannerContext) =>
      context?.stepTwoBlackStacksOnWhiteComplete === true,
    slotDropHintActive: () => false,
    wellPieceIdlePulseActive: () => false,
    /** White + scripted black + player's next drop. */
    isComplete: (map, _context?: TutorialCompletionContext) =>
      countPiecesOnBoard(map) >= 3,
    runOnComplete: async () => {},
  },
  {
    id: "tutorialStep3",
    scenarioId: "tutorialStep1",
    tutorialStepQuery: "3",
    bannerMessage: "",
    matchesScenario: (scenario, step) =>
      matchesTutorialHandoff(scenario, step, "3"),
    showBanner: () => false,
    slotDropHintActive: () => false,
    wellPieceIdlePulseActive: () => false,
    /** Second scripted black on board (fourth piece). */
    isComplete: (map, _context?: TutorialCompletionContext) =>
      countPiecesOnBoard(map) >= 4,
    runOnComplete: async () => {},
  },
  {
    id: "tutorialStep4",
    scenarioId: "tutorialStep4",
    tutorialStepQuery: "4",
    bannerMessage:
      "The object of the game is to get four pieces in a row, horizontally, vertically, or diagonally.\nPlace a piece to win the game!",
    matchesScenario: (scenario, step) =>
      matchesTutorialHandoff(scenario, step, "4"),
    showBanner: (_map, context?: TutorialShowBannerContext) =>
      context?.winLessonBannerReady === true,
    slotDropHintActive: () => false,
    wellPieceIdlePulseActive: () => false,
    isComplete: (_map, context?: TutorialCompletionContext) =>
      context?.currentStatus === "finished" &&
      context?.currentWinner === Team.One &&
      context?.tutorialStep4WinHoldComplete === true,
    runOnComplete: async () => {},
  },
  {
    id: "tutorialStep5",
    scenarioId: "tutorialStep5",
    tutorialStepQuery: "5",
    bannerMessage:
      "Instead of dropping a piece, you may swipe the board up, down, left or right to make the pieces drop in that direction. Shift gravity to win the game!",
    matchesScenario: (scenario, step) =>
      matchesTutorialHandoff(scenario, step, "5"),
    showBanner: (_map, context?: TutorialShowBannerContext) =>
      context?.gravityLessonBannerReady === true,
    slotDropHintActive: () => false,
    wellPieceIdlePulseActive: () => false,
    isComplete: (map, context?: TutorialCompletionContext) => {
      if (!context) return false;
      if (
        context.gravityLessonBannerBaselineTurn == null ||
        context.gravityLessonBannerBaselineOnBoardCount == null
      ) {
        return false;
      }
      return (
        context.currentTurnCount > context.gravityLessonBannerBaselineTurn &&
        countPiecesOnBoard(map) ===
          context.gravityLessonBannerBaselineOnBoardCount
      );
    },
    runOnComplete: async () => {},
  },
  {
    id: "tutorialStep6",
    scenarioId: "tutorialStep6",
    tutorialStepQuery: "6",
    bannerMessage:
      "Gravity can be used for defense as well as offense. Pull gravity to shift this hopeless position to an advantageous one.",
    matchesScenario: (scenario, step) =>
      matchesTutorialHandoff(scenario, step, "6"),
    showBanner: (_map, context?: TutorialShowBannerContext) =>
      context?.defenseLessonBannerReady === true,
    slotDropHintActive: () => false,
    wellPieceIdlePulseActive: () => false,
    isComplete: (map, context?: TutorialCompletionContext) => {
      if (!context) return false;
      if (
        context.defenseLessonBannerBaselineTurn == null ||
        context.defenseLessonBannerBaselineOnBoardCount == null
      ) {
        return false;
      }
      return (
        context.currentTurnCount > context.defenseLessonBannerBaselineTurn &&
        countPiecesOnBoard(map) ===
          context.defenseLessonBannerBaselineOnBoardCount
      );
    },
    runOnComplete: async () => {},
  },
  {
    id: "tutorialStep7",
    scenarioId: "tutorialStep7",
    tutorialStepQuery: "7",
    bannerMessage: "Shake your device at any time to restart the game.",
    matchesScenario: (scenario, step) =>
      matchesTutorialHandoff(scenario, step, "7"),
    showBanner: (_map, context?: TutorialShowBannerContext) =>
      context?.shakeLessonBannerReady === true,
    slotDropHintActive: () => false,
    wellPieceIdlePulseActive: () => false,
    isComplete: (map, context?: TutorialCompletionContext) => {
      if (!context) return false;
      return (
        context.currentStatus === "playing" &&
        context.boardOccupiedCount === 0 &&
        context.currentTurnCount === 0 &&
        countPiecesOnBoard(map) === 0
      );
    },
    runOnComplete: async () => {},
  },
  {
    id: "tutorialStep8",
    scenarioId: "tutorialStep8",
    tutorialStepQuery: "8",
    bannerMessage: "To replay the tutorial, visit the Settings menu. Have fun!",
    matchesScenario: (scenario, step) =>
      matchesTutorialHandoff(scenario, step, "8"),
    showBanner: (_map, context?: TutorialShowBannerContext) =>
      context?.tutorialStep8BannerReady === true,
    slotDropHintActive: () => false,
    wellPieceIdlePulseActive: () => false,
    isComplete: (_map, context?: TutorialCompletionContext) =>
      context?.tutorialStep8OutroComplete === true,
    runOnComplete: async () => {},
  },
];

/** Effective tutorial step for UI (step 1→2 handoff stays on `tutorialStep1` URL). */
export function getResolvedGamePlayTutorialStepParam(
  scenarioParam: string | undefined,
  tutorialStepParam: string | undefined,
  tutorialUiStepWhenScenarioIsTutorialStep1: string,
): string {
  if (scenarioParam === "tutorialStep1")
    return tutorialUiStepWhenScenarioIsTutorialStep1;
  return tutorialStepParam ?? "1";
}

export function resolveGamePlayTutorialStep(
  scenarioParam: string | undefined,
  effectiveTutorialStepParam: string | undefined,
): GamePlayTutorialStep | null {
  return (
    GAME_PLAY_TUTORIAL_STEPS.find((s) =>
      s.matchesScenario(scenarioParam, effectiveTutorialStepParam),
    ) ?? null
  );
}
