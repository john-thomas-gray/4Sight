import { SharedValue } from "react-native-reanimated";
import { GameMode } from "../types/logic";

export const pieceHoldOffset = (
  gameMode: GameMode,
  playersTurn: number,
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
    if (playersTurn % 2 === 1) {
      translateX.value = eventX - pieceRadius;
      translateY.value = eventY - pieceRadius - 40;
    } else if (playersTurn % 2 === 0) {
      translateX.value = eventX - pieceRadius;
      translateY.value = eventY - pieceRadius + 40;
    }
  } else {
    if (playersTurn === 1) {
      translateX.value = eventX - pieceRadius;
      translateY.value = eventY - pieceRadius - 40;
    } else if (playersTurn === 2) {
      translateX.value = eventX - pieceRadius - 40;
      translateY.value = eventY - pieceRadius;
    } else if (playersTurn === 3) {
      translateX.value = eventX - pieceRadius;
      translateY.value = eventY - pieceRadius + 40;
    } else {
      translateX.value = eventX - pieceRadius + 40;
      translateY.value = eventY - pieceRadius;
    }
  }
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
