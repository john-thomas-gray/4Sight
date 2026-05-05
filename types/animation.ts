import { SharedValue } from "react-native-reanimated";

export const PIECE_TO_SLOT = 150;
export const PIECE_TO_SLOT_ALT = 200;
export const SLOT_TO_SPACE = 700;
export const RETURN_TO_WELL = 300;

/** Full-board reset: rise on board → beat → zip centered over well → beat → lower in place. */
export const RESET_TO_WELL_RISE_MS = 300;
export const RESET_TO_WELL_BEAT_MS = 160;
export const RESET_TO_WELL_ZIP_MS = 420;
export const RESET_TO_WELL_LOWER_MS = 240;
/** Pixels upward while x/y stay over the cell. */
export const RESET_TO_WELL_RISE_DY = 48;

export const RESET_TO_WELL_TOTAL_MS =
  RESET_TO_WELL_RISE_MS +
  RESET_TO_WELL_BEAT_MS +
  RESET_TO_WELL_ZIP_MS +
  RESET_TO_WELL_BEAT_MS +
  RESET_TO_WELL_LOWER_MS;
export const BOARD_COLOR_CHANGE = SLOT_TO_SPACE + 100;

export const WINNER_V1_DELAY = 1000;
export const WINNER_V1 = 700;
export const WINNER_V0_DELAY = 100;
export const WINNER_V0 = 700;

export const WAIT_FOR_WINNER_CHECK = WINNER_V1_DELAY + WINNER_V0_DELAY;

export const WINNER_BASE_DELAY = 500;
export const GRAVITY_IN_PROGRESS = BOARD_COLOR_CHANGE;

/* COMPLETE ANIMATIONS */
export const ANIMATE_TO_SELECTED_CELL = 200;
export const ANIMATE_PIECE_DROP =
  PIECE_TO_SLOT + SLOT_TO_SPACE + BOARD_COLOR_CHANGE;

export type PieceAnimation = {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  scaleX: SharedValue<number>;
  scaleY: SharedValue<number>;
  color: SharedValue<string>;
  winnerColor: SharedValue<string>;
  zIndex: SharedValue<number>;
};
