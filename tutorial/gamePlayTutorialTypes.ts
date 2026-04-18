import type { GameState } from "@/engine";
import type { PieceStatusMap } from "@/types/pieceStatus";

/** Passed to {@link GamePlayTutorialStep.isComplete} for steps that need engine/UI state. */
export type TutorialCompletionContext = {
  currentTurnCount: number;
  currentStatus: GameState["status"];
  currentWinner: GameState["winner"];
  /** Cells occupied on the board (for step 7 reset detection). */
  boardOccupiedCount: number;
  /** Set when the step 5 gravity banner has been shown. */
  gravityLessonBannerBaselineTurn: number | null;
  gravityLessonBannerBaselineOnBoardCount: number | null;
  /** Set when the step 6 defense banner has been shown (gravity baseline). */
  defenseLessonBannerBaselineTurn: number | null;
  defenseLessonBannerBaselineOnBoardCount: number | null;
  /** Step 4: team-one win animation played; safe to advance to gravity lesson. */
  tutorialStep4WinHoldComplete: boolean;
  /** Step 8: outro banner has been visible long enough to exit. */
  tutorialStep8OutroComplete: boolean;
};

/** Optional context for steps that gate the banner on game state (e.g. step 2). */
export type TutorialShowBannerContext = {
  /** Tutorial step 2: scripted black has stacked on white; show the banner. */
  stepTwoBlackStacksOnWhiteComplete: boolean;
  /** Tutorial step 4: near-win board ready; show the win lesson. */
  winLessonBannerReady: boolean;
  /** Tutorial step 5: gravity-primer board ready; show gravity lesson. */
  gravityLessonBannerReady: boolean;
  /** Tutorial step 6: tight-spot board ready; show defense lesson. */
  defenseLessonBannerReady: boolean;
  /** Tutorial step 7: shake lesson (board still in play or any playing state). */
  shakeLessonBannerReady: boolean;
  /** Tutorial step 8: outro after reset; empty board. */
  tutorialStep8BannerReady: boolean;
};

/** Minimal router surface tutorial completion needs. */
export type TutorialGamePlayRouter = {
  replace: (href: string) => void;
};

/**
 * One interactive step while `gamePlay` is mounted, keyed by scenario + query.
 * Add new entries for additional tutorial steps instead of branching in the screen.
 */
export type GamePlayTutorialStep = {
  readonly id: string;
  readonly scenarioId: string;
  readonly tutorialStepQuery: string;
  readonly bannerMessage: string;
  readonly matchesScenario: (
    scenarioParam: string | undefined,
    tutorialStepParam: string | undefined,
  ) => boolean;
  readonly showBanner: (
    pieceStatusMap: PieceStatusMap,
    context?: TutorialShowBannerContext,
  ) => boolean;
  /** Slot rim opening pulse while dragging toward a slot (e.g. tutorial). */
  readonly slotDropHintActive: (pieceStatusMap: PieceStatusMap) => boolean;
  /** Well piece scale pulse before the user picks up the focus piece (e.g. tutorial). */
  readonly wellPieceIdlePulseActive: (
    pieceStatusMap: PieceStatusMap,
  ) => boolean;
  readonly isComplete: (
    pieceStatusMap: PieceStatusMap,
    context?: TutorialCompletionContext,
  ) => boolean;
  readonly runOnComplete: (router: TutorialGamePlayRouter) => Promise<void>;
};
