import { SharedValue } from "react-native-reanimated";

export const PIECE_TO_SLOT = 150;
export const PIECE_TO_SLOT_ALT = 200;
export const SLOT_TO_SPACE = 700;
export const RETURN_TO_WELL = 300;
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
