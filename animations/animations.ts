import { Animations, GameElements } from "@/constants";
import { Board } from "@/types";
import { CellLayout } from "@/types/board";
import {
  Easing,
  SharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type animateMisplacedPieceProps = {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  currentWellDataSV: SharedValue<Board.CellLayout>;
};

export const animateMisplacedPiece = ({
  translateX,
  translateY,
  currentWellDataSV,
}: animateMisplacedPieceProps) => {
  "worklet";
  const well = currentWellDataSV;
  console.log(well);
  if (!well || !well) return;
  console.log("working");
  translateX.value = withTiming(
    well.value.pageX + well.value.width / 2 - GameElements.PIECE_RADIUS,
    {
      duration: Animations.WELL_RETURN_DURATION,
      easing: Easing.inOut(Easing.quad),
    }
  );
  translateY.value = withTiming(
    well.value.pageY + well.value.height / 2 - GameElements.PIECE_RADIUS,
    {
      duration: Animations.WELL_RETURN_DURATION,
      easing: Easing.inOut(Easing.quad),
    }
  );
};

type AnimateToSelectedCell = {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  selectedCell: SharedValue<Board.CellLayout>;
};

export const animateToSelectedCell = ({
  translateX,
  translateY,
  selectedCell,
}: AnimateToSelectedCell) => {
  "worklet";
  translateX.value = withTiming(
    selectedCell.value!.pageX +
      selectedCell.value!.height / 2 -
      GameElements.PIECE_RADIUS,
    {
      duration: Animations.WELL_RETURN_DURATION,
      easing: Easing.inOut(Easing.quad),
    }
  );
  translateY.value = withTiming(
    selectedCell.value!.pageY +
      selectedCell.value!.height / 2 -
      GameElements.PIECE_RADIUS,
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
  "worklet";
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
  "worklet";
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

// translateX: SharedValue<number>;
// translateY: SharedValue<number>;
// slotX: number;
// slotY: number;
// slotWidth: number;
// slotHeight: number;
// spaceX: number;
// spaceY: number;
// spaceWidth: number;
// spaceHeight: number;

export const animatePieceDrop = ({
  translateX,
  translateY,
  slotLayout,
  spaceLayout,
}: {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  slotLayout: CellLayout;
  spaceLayout: CellLayout;
}) => {
  "worklet";
  translateX.value = withSequence(
    withTiming(
      slotLayout.pageX + slotLayout.width / 2 - GameElements.PIECE_RADIUS,
      {
        duration: Animations.SLOT_INSERT_DURATION,
        easing: Easing.inOut(Easing.quad),
      }
    ),
    withTiming(
      spaceLayout.pageX + spaceLayout.width / 2 - GameElements.PIECE_RADIUS,
      {
        duration: Animations.SLOT_TO_SPACE_DURATION,
        easing: Easing.bounce,
      }
    )
  );

  translateY.value = withSequence(
    withTiming(
      slotLayout.pageY + slotLayout.height / 2 - GameElements.PIECE_RADIUS,
      {
        duration: Animations.SLOT_INSERT_DURATION,
        easing: Easing.inOut(Easing.quad),
      }
    ),
    withTiming(
      spaceLayout.pageY + spaceLayout.height / 2 - GameElements.PIECE_RADIUS,
      {
        duration: Animations.SLOT_TO_SPACE_DURATION,
        easing: Easing.bounce,
      }
    )
  );
};

// animatePieceDrop({
//   translateX,
//   translateY,
//   slotLayout.pageX: scX,
//   slotLayout.slotY: scY,
//   slotLayout.slotWidth: scWidth,
//   slotLayout.slotHeight: scHeight,
//   spaceLayout.pageX: finalSpaceLayout.pageY,
//   spaceY: finalSpaceLayout.pageX,
//   spaceWidth: finalSpaceLayout.width,
//   spaceHeight: finalSpaceLayout.height,
// });

// const animateToWell;
