import {
  PLAYER_ONE_HOLD_OFFSET_X,
  PLAYER_ONE_HOLD_OFFSET_Y,
  PLAYER_TWO_HOLD_OFFSET_X,
  PLAYER_TWO_HOLD_OFFSET_Y,
} from "@/constants/animations";
import { Team } from "@/types/board";
import { SharedValue } from "react-native-reanimated";
import { GameMode } from "../types/logic";

export const pieceHoldOffset = (
  gameMode: GameMode,
  team: Team,
  translateX: SharedValue<number>,
  translateY: SharedValue<number>,
  eventX: number,
  eventY: number,
  pieceRadius: number,
  active: boolean
) => {
  "worklet";
  if (!active) return;

  if (gameMode === GameMode.TwoPlayer) {
    if (team === Team.TeamOne) {
      translateX.value = eventX + PLAYER_ONE_HOLD_OFFSET_X;
      translateY.value = eventY + PLAYER_ONE_HOLD_OFFSET_Y;
    } else if (team === Team.TeamTwo) {
      translateX.value = eventX + PLAYER_TWO_HOLD_OFFSET_X;
      translateY.value = eventY + PLAYER_TWO_HOLD_OFFSET_Y;
    }
  }
  // else {
  //   if (team ===  1) {
  //     translateX.value = eventX - pieceRadius;
  //     translateY.value = eventY - pieceRadius - 40;
  //   } else if (team === 2) {
  //     translateX.value = eventX - pieceRadius - 40;
  //     translateY.value = eventY - pieceRadius;
  //   } else if (team === 3) {
  //     translateX.value = eventX - pieceRadius;
  //     translateY.value = eventY - pieceRadius + 40;
  //   } else {
  //     translateX.value = eventX - pieceRadius + 40;
  //     translateY.value = eventY - pieceRadius;
  //   }
  // }
};

export const pointerHoverOffset = (
  gameMode: GameMode,
  playersTurn: number,
  eventX: number,
  eventY: number
) => {
  "worklet";
  let adjustedX = eventX;
  let adjustedY = eventY;

  if (gameMode === GameMode.TwoPlayer) {
    if (playersTurn % 2 === 1) {
      adjustedY = eventY - 40;
    } else if (playersTurn % 2 === 0) {
      adjustedY = eventY + 40;
    }
  } else {
    if (playersTurn === 1) {
      adjustedY = eventY - 40;
    } else if (playersTurn === 2) {
      adjustedX = eventX - 40;
    } else if (playersTurn === 3) {
      adjustedY = eventY + 40;
    } else {
      adjustedX = eventX + 40;
    }
  }

  return { adjustedX, adjustedY };
};
