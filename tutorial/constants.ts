import { WINNER_CASCADE_STAGGER_MS, WIN_LENGTH } from "@/engine";
import { WINNER_V0, WINNER_V1 } from "@/types/animation";

/**
 * Well cell that holds piece `"0"` in the `tutorialStep1` scenario.
 * Step two leaves this cell empty while refilling all other wells.
 */
export const TUTORIAL_STEP_ONE_SOURCE_WELL_CELL_ID = "12-10";

/** Longest tier delay for a line of {@link WIN_LENGTH} + winner motion (see `animateWinnerPiece`). */
export const TUTORIAL_STEP4_WIN_MOTION_SETTLE_MS =
  WINNER_CASCADE_STAGGER_MS * (WIN_LENGTH - 1) + WINNER_V1 + WINNER_V0;

/** Banner time on tutorial step 8 before exiting to a new game. */
export const TUTORIAL_STEP8_OUTRO_MS = 4000;
