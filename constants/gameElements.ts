import { ViewStyle } from "react-native";

export const BOARD_SIZE: number = 9;
export const BOARD_SIZE_ZERO_IDX: number = BOARD_SIZE - 1;

export const BASE_CELL_SIZE: number = 40;
export const BASE_CELL_BORDER_WIDTH: number = 1;
export const BASE_CELL_BORDER_COLOR: string = "#ccc";
export const BASE_CELL_MARGIN_H: number = 0;
export const BASE_CELL_ALIGN_ITEMS: "center" | "flex-start" | "flex-end" =
  "center";
export const BASE_CELL_JUSTIFY_CONTENT:
  | "center"
  | "flex-start"
  | "flex-end"
  | "space-between" = "center";

export const CELL_STYLE: ViewStyle = {
  width: BASE_CELL_SIZE,
  height: BASE_CELL_SIZE,
  borderWidth: BASE_CELL_BORDER_WIDTH,
  borderColor: BASE_CELL_BORDER_COLOR,
  marginLeft: BASE_CELL_MARGIN_H,
  marginRight: BASE_CELL_MARGIN_H,
  alignItems: BASE_CELL_ALIGN_ITEMS,
  justifyContent: BASE_CELL_JUSTIFY_CONTENT,
};
export const SPACE_STYLE: ViewStyle = {
  ...CELL_STYLE,
};

export const SLOT_BORDER_WIDTH: number = 2;
export const SLOT_POSITION: "absolute" | "relative" = "relative";
export const SLOT_STYLE: ViewStyle = {
  ...CELL_STYLE,
  borderWidth: SLOT_BORDER_WIDTH,
  position: SLOT_POSITION,
};

export const WELL_MARGIN_H: number = 1;

export const WELL_STYLE: ViewStyle = {
  ...CELL_STYLE,
  marginLeft: WELL_MARGIN_H,
  marginRight: WELL_MARGIN_H,
};

export const CORNER_STYLE: ViewStyle = {
  ...CELL_STYLE,
};
export const CORNER_BORDER_RADIUS: number = 8;

export const PIECE_SIZE: number = 32;
export const PIECE_RADIUS: number = PIECE_SIZE / 2;
