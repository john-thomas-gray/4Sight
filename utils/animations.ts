// utils/animations.ts
import { Animations, GameElements } from "@/constants";
import { Board } from "@/types";
import {
  Easing,
  SharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type animateReturnToWellProps = {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  targetWellData: SharedValue<Board.CellProps | null>;
};

export const animateReturnToWell = ({
  translateX,
  translateY,
  targetWellData,
}: animateReturnToWellProps) => {
  const well = targetWellData.value;
  if (!well || !well.layout) return;
  translateX.value = withTiming(
    well.layout.pageX + well.layout.width / 2 - GameElements.PIECE_RADIUS,
    {
      duration: Animations.WELL_RETURN_DURATION,
      easing: Easing.inOut(Easing.quad),
    }
  );
  translateY.value = withTiming(
    well.layout.pageY + well.layout.height / 2 - GameElements.PIECE_RADIUS,
    {
      duration: Animations.WELL_RETURN_DURATION,
      easing: Easing.inOut(Easing.quad),
    }
  );
};

type AnimatePlaceInSlotProps = {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  selectedCellX: number;
  selectedCellY: number;
  selectedCellWidthX: number;
  selectedCellHeightY: number;
};

export const animatePlaceInSlot = ({
  translateX,
  translateY,
  selectedCellX,
  selectedCellY,
  selectedCellWidthX,
  selectedCellHeightY,
}: AnimatePlaceInSlotProps) => {
  translateX.value = withTiming(
    selectedCellX + selectedCellWidthX / 2 - GameElements.PIECE_RADIUS,
    {
      duration: Animations.SLOT_INSERT_DURATION,
      easing: Easing.inOut(Easing.quad),
    }
  );
  translateY.value = withTiming(
    selectedCellY + selectedCellHeightY / 2 - GameElements.PIECE_RADIUS,
    {
      duration: Animations.SLOT_INSERT_DURATION,
      easing: Easing.inOut(Easing.quad),
    }
  );
};

export const animateSlotToSpace = ({
  translateX,
  translateY,
  selectedCellX,
  selectedCellY,
  selectedCellWidthX,
  selectedCellHeightY,
}: AnimatePlaceInSlotProps) => {
  translateX.value = withTiming(
    selectedCellX + selectedCellWidthX / 2 - GameElements.PIECE_RADIUS,
    {
      duration: Animations.SLOT_TO_SPACE_DURATION,
      easing: Easing.inOut(Easing.quad),
    }
  );
  translateY.value = withTiming(
    selectedCellY + selectedCellHeightY / 2 - GameElements.PIECE_RADIUS,
    {
      duration: Animations.SLOT_TO_SPACE_DURATION,
      easing: Easing.inOut(Easing.quad),
    }
  );
};

export const animatePieceDrop = ({
  translateX,
  translateY,
  slotX,
  slotY,
  slotWidth,
  slotHeight,
  spaceX,
  spaceY,
  spaceWidth,
  spaceHeight,
}: {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  slotX: number;
  slotY: number;
  slotWidth: number;
  slotHeight: number;
  spaceX: number;
  spaceY: number;
  spaceWidth: number;
  spaceHeight: number;
}) => {
  translateX.value = withSequence(
    withTiming(slotX + slotWidth / 2 - GameElements.PIECE_RADIUS, {
      duration: Animations.SLOT_INSERT_DURATION,
      easing: Easing.inOut(Easing.quad),
    }),
    withTiming(spaceX + spaceWidth / 2 - GameElements.PIECE_RADIUS, {
      duration: Animations.SLOT_TO_SPACE_DURATION,
      easing: Easing.bounce,
    })
  );

  translateY.value = withSequence(
    withTiming(slotY + slotHeight / 2 - GameElements.PIECE_RADIUS, {
      duration: Animations.SLOT_INSERT_DURATION,
      easing: Easing.inOut(Easing.quad),
    }),
    withTiming(spaceY + spaceHeight / 2 - GameElements.PIECE_RADIUS, {
      duration: Animations.SLOT_TO_SPACE_DURATION,
      easing: Easing.bounce,
    })
  );
};

// animatePieceDrop({
//   translateX,
//   translateY,
//   slotX: scX,
//   slotY: scY,
//   slotWidth: scWidth,
//   slotHeight: scHeight,
//   spaceX: finalSpaceLayout.pageY,
//   spaceY: finalSpaceLayout.pageX,
//   spaceWidth: finalSpaceLayout.width,
//   spaceHeight: finalSpaceLayout.height,
// });

// const animateToWell;
