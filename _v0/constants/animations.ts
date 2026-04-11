import { PieceAnimation } from "@/types/animation";
import { makeMutable } from "react-native-reanimated";
import { INITIAL_PIECE_POSITIONS, PIECE_WELL_SCALE } from "./gameElements";

export const PIECE_TO_SLOT = 150;
export const SLOT_TO_SPACE = 700;
export const RETURN_TO_WELL = 300;
export const BOARD_COLOR_CHANGE = 300;

export const WINNER_V1_DELAY = 1000;
export const WINNER_V1 = 350;
export const WINNER_V0_DELAY = 100;
export const WINNER_V0 = 350;

export const WAIT_FOR_WINNER_CHECK = WINNER_V1_DELAY + WINNER_V0_DELAY;

export const WINNER_BASE_DELAY = 500;
export const GRAVITY_IN_PROGRESS = 1000;

/* COMPLETE ANIMATIONS */
export const ANIMATE_TO_SELECTED_CELL = 200;
export const ANIMATE_PIECE_DROP = PIECE_TO_SLOT + SLOT_TO_SPACE;

/* NEW AND GOOD ANIMATIONS */

export const WELL_SCALE_DURATION = 500;
export const BOARD_SCALE_DURATION = 200;
export const HELD_SCALE_DURATION = 100;
export const RESET_PIECE_DURATION = 500;

export const WELL_ZINDEX_DELAY = 500;
export const BOARD_ZINDEX_DELAY = 200;
export const HELD_ZINDEX_DELAY = 0;
export const RESET_PIECE_DELAY = 500;

export const PLAYER_ONE_HOLD_OFFSET_X = -15;
export const PLAYER_ONE_HOLD_OFFSET_Y = -65;
export const PLAYER_TWO_HOLD_OFFSET_X = -10;
export const PLAYER_TWO_HOLD_OFFSET_Y = 50;

export const PLAYER_ONE_HOVER_OFFSET_X = 0;
export const PLAYER_ONE_HOVER_OFFSET_Y = 0;
export const PLAYER_TWO_HOVER_OFFSET_X = -10;
export const PLAYER_TWO_HOVER_OFFSET_Y = 40;

export const pieceAnimSharedValues: Record<string, PieceAnimation> = {
  "0": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["0"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["0"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "1": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["1"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["1"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "2": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["2"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["2"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "3": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["3"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["3"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "4": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["4"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["4"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "5": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["5"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["5"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "6": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["6"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["6"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "7": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["7"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["7"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "8": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["8"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["8"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "9": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["9"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["9"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "10": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["10"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["10"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "11": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["11"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["11"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "12": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["12"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["12"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "13": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["13"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["13"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "14": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["14"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["14"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "15": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["15"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["15"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "16": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["16"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["16"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "17": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["17"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["17"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "18": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["18"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["18"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "19": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["19"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["19"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "20": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["20"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["20"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "21": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["21"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["21"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "22": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["22"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["22"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "23": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["23"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["23"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "24": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["24"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["24"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "25": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["25"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["25"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "26": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["26"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["26"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "27": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["27"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["27"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "28": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["28"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["28"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "29": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["29"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["29"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "30": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["30"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["30"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "31": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["31"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["31"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "32": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["32"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["32"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "33": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["33"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["33"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "34": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["34"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["34"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "35": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["35"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["35"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "36": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["36"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["36"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "37": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["37"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["37"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "38": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["38"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["38"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "39": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["39"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["39"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "40": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["40"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["40"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "41": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["41"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["41"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "42": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["42"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["42"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "43": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["43"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["43"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "44": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["44"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["44"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "45": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["45"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["45"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "46": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["46"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["46"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
  "47": {
    translateX: makeMutable(INITIAL_PIECE_POSITIONS["47"].x),
    translateY: makeMutable(INITIAL_PIECE_POSITIONS["47"].y),
    scaleX: makeMutable(PIECE_WELL_SCALE),
    scaleY: makeMutable(PIECE_WELL_SCALE),
    color: makeMutable("#ffffff"),
    winnerColor: makeMutable("#fdffd0ff"),
    zIndex: makeMutable(500),
  },
};
