import { SharedValue } from "react-native-reanimated";

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
export const WINNER_V1 = 700;
export const WINNER_V0 = 700;

export type PieceAnimation = {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  scaleX: SharedValue<number>;
  scaleY: SharedValue<number>;
  color: SharedValue<string>;
  winnerColor: SharedValue<string>;
  zIndex: SharedValue<number>;
};
