import type { PieceStatusMap } from "@/types/pieceStatus";

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
  readonly showBanner: (pieceStatusMap: PieceStatusMap) => boolean;
  readonly slotDropHintActive: (pieceStatusMap: PieceStatusMap) => boolean;
  readonly isComplete: (pieceStatusMap: PieceStatusMap) => boolean;
  readonly runOnComplete: (router: TutorialGamePlayRouter) => Promise<void>;
};
