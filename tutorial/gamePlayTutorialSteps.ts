import { PieceStatus, type PieceStatusMap } from "@/types/pieceStatus";
import { clearSession, saveTutorialCompleted } from "@/storage";
import type { GamePlayTutorialStep, TutorialGamePlayRouter } from "./gamePlayTutorialTypes";

const FOCUS_PIECE_TUTORIAL_STEP1 = "0";

async function completeTutorialStepOne(router: TutorialGamePlayRouter) {
  await clearSession();
  await saveTutorialCompleted(true);
  router.replace("/");
}

/** Deep link for step 1 — keep in sync with `dev/scenarios` `tutorialStep1`. */
export const TUTORIAL_STEP_ONE_GAMEPLAY_PATH = "/gamePlay?scenario=tutorialStep1&tutorialStep=1";

export const GAME_PLAY_TUTORIAL_STEPS: readonly GamePlayTutorialStep[] = [
  {
    id: "tutorialStep1",
    scenarioId: "tutorialStep1",
    tutorialStepQuery: "1",
    bannerMessage:
      "Drag the piece in your well and release it over a slot so it drops onto the board.",
    matchesScenario: (scenario, step) =>
      scenario === "tutorialStep1" && step === "1",
    showBanner: (map) => map[FOCUS_PIECE_TUTORIAL_STEP1] !== PieceStatus.onBoard,
    slotDropHintActive: (map) =>
      map[FOCUS_PIECE_TUTORIAL_STEP1] === PieceStatus.isHeld,
    isComplete: (map) => map[FOCUS_PIECE_TUTORIAL_STEP1] === PieceStatus.onBoard,
    runOnComplete: completeTutorialStepOne,
  },
];

export function resolveGamePlayTutorialStep(
  scenarioParam: string | undefined,
  tutorialStepParam: string | undefined,
): GamePlayTutorialStep | null {
  return (
    GAME_PLAY_TUTORIAL_STEPS.find((s) =>
      s.matchesScenario(scenarioParam, tutorialStepParam),
    ) ?? null
  );
}
