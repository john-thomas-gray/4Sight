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
export const PIECE_HELD_SCALE: number = 1.5;
export const PIECE_WELL_SCALE: number = 1.1;
export const PIECE_PLACED_SCALE: number = 1;

export const INITIAL_PIECE_POSITIONS = {
  "0": { x: 94, y: 34 },
  "1": { x: 136, y: 34 },
  "2": { x: 178, y: 34 },
  "3": { x: 94, y: 76 },
  "4": { x: 136, y: 76 },
  "5": { x: 178, y: 76 },
  "6": { x: 94, y: 118 },
  "7": { x: 136, y: 118 },
  "8": { x: 178, y: 118 },
  "9": { x: 94, y: 160 },
  "10": { x: 136, y: 160 },
  "11": { x: 178, y: 160 },
  "12": { x: 94, y: 202 },
  "13": { x: 136, y: 202 },
  "14": { x: 178, y: 202 },
  "15": { x: 94, y: 244 },
  "16": { x: 136, y: 244 },
  "17": { x: 178, y: 244 },
  "18": { x: 94, y: 286 },
  "19": { x: 136, y: 286 },
  "20": { x: 178, y: 286 },
  "21": { x: 94, y: 328 },
  "22": { x: 136, y: 328 },
  "23": { x: 178, y: 328 },
  "24": { x: 665, y: 34 },
  "25": { x: 707, y: 34 },
  "26": { x: 749, y: 34 },
  "27": { x: 665, y: 76 },
  "28": { x: 707, y: 76 },
  "29": { x: 749, y: 76 },
  "30": { x: 665, y: 118 },
  "31": { x: 707, y: 118 },
  "32": { x: 749, y: 118 },
  "33": { x: 665, y: 160 },
  "34": { x: 707, y: 160 },
  "35": { x: 749, y: 160 },
  "36": { x: 665, y: 202 },
  "37": { x: 707, y: 202 },
  "38": { x: 749, y: 202 },
  "39": { x: 665, y: 244 },
  "40": { x: 707, y: 244 },
  "41": { x: 749, y: 244 },
  "42": { x: 665, y: 286 },
  "43": { x: 707, y: 286 },
  "44": { x: 749, y: 286 },
  "45": { x: 665, y: 328 },
  "46": { x: 707, y: 328 },
  "47": { x: 749, y: 328 },
};
