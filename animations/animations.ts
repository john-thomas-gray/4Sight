import { Animations, GameElements } from "@/constants";
import { Board } from "@/types";
import { CellLayout, EachCellType } from "@/types/board";
import {
  Easing,
  SharedValue,
  withSequence,
  withTiming
} from "react-native-reanimated";

type animateMisplacedPieceProps = {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  currentWellLayout: Board.CellLayout;
};

export const animateMisplacedPiece = ({
  translateY,
  translateX,
  currentWellLayout
}: animateMisplacedPieceProps) => {
  "worklet";
  const well = currentWellLayout;
  console.log(well);
  if (!well || !well) return;
  console.log("working");
  translateX.value = withTiming(
    well.pageX + well.width / 2 - GameElements.PIECE_RADIUS,
    {
      duration: Animations.WELL_RETURN_DURATION,
      easing: Easing.inOut(Easing.quad),
    }
  );
  translateY.value = withTiming(
    well.pageY + well.height / 2 - GameElements.PIECE_RADIUS,
    {
      duration: Animations.WELL_RETURN_DURATION,
      easing: Easing.inOut(Easing.quad),
    }
  );
};

type AnimateToSelectedCell = {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  selectedCell: EachCellType;
};

export const animateToSelectedCell = ({
  translateX,
  translateY,
  selectedCell,
}: AnimateToSelectedCell) => {
  "worklet";
  translateX.value = withTiming(
    // !@#
    selectedCell.layout!.pageX +
      selectedCell.layout!.height / 2 -
      GameElements.PIECE_RADIUS,
    {
      duration: Animations.WELL_RETURN_DURATION,
      easing: Easing.inOut(Easing.quad),
    }
  );
  translateY.value = withTiming(
    // !@#
    selectedCell.layout!.pageY +
      selectedCell.layout!.height / 2 -
      GameElements.PIECE_RADIUS,
    {
      duration: Animations.WELL_RETURN_DURATION,
      easing: Easing.inOut(Easing.quad),
    }
  );
};

//!@# I don't understand how this works?
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
    // withDelay(SLOT_INSERT_DURATION, withTiming(
    //   spaceLayout.pageX + spaceLayout.width / 2 - GameElements.PIECE_RADIUS,
    //   {
    //     duration: Animations.SLOT_TO_SPACE_DURATION,
    //     easing: Easing.bounce,
    //   }

    // ))
  );

  translateY.value = withSequence(
    withTiming(
      slotLayout.pageY + slotLayout.height / 2 - GameElements.PIECE_RADIUS,
      {
        duration: Animations.SLOT_INSERT_DURATION,
        easing: Easing.inOut(Easing.quad),
      }
    ),
    // withDelay(SLOT_INSERT_DURATION, withTiming(
    //   spaceLayout.pageY + spaceLayout.height / 2 - GameElements.PIECE_RADIUS,
    //   {
    //     duration: Animations.SLOT_TO_SPACE_DURATION,
    //     easing: Easing.bounce,
    //   }
    // ))
  );
};
