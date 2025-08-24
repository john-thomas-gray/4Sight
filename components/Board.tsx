import {
  BOARD_COLOR_CHANGE_DURATION,
  PIECE_DROP_DURATION,
} from "@/constants/animations";
import {
  BASE_CELL_SIZE,
  BOARD_SIZE,
  BOARD_SIZE_ZERO_IDX,
} from "@/constants/gameElements";
import { useGameContext } from "@/context/GameContext";
import { useGravity } from "@/hooks/useGravity";
import { PullDirection } from "@/types/board";
import React from "react";
import { StyleSheet, View } from "react-native";
import {
  Directions,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Corner from "./Corner";
import Slot from "./Slot";
import Space from "./Space";

type BoardProps = {
  className?: string;
  onRotate?: (direction: "clockwise" | "counterclockwise") => void;
};

const Board = ({ className, onRotate }: BoardProps) => {
  const { logic } = useGameContext();
  const isSlotPosition = (row: number, col: number) => {
    return (
      (row === 0 && col > 0 && col < BOARD_SIZE_ZERO_IDX) || // Top
      (row === BOARD_SIZE_ZERO_IDX && col > 0 && col < BOARD_SIZE_ZERO_IDX) || // Bottom
      (col === 0 && row > 0 && row < BOARD_SIZE_ZERO_IDX) || // Left
      (col === BOARD_SIZE_ZERO_IDX && row > 0 && row < BOARD_SIZE_ZERO_IDX) // Right
    );
  };

  const isCornerPosition = (row: number, col: number) => {
    return (
      (row === 0 && col === 0) ||
      (row === 0 && col === BOARD_SIZE_ZERO_IDX) ||
      (row === BOARD_SIZE_ZERO_IDX && col === BOARD_SIZE_ZERO_IDX) ||
      (row === BOARD_SIZE_ZERO_IDX && col === 0)
    );
  };

  const pullPieces = useGravity();
  const executePull = (direction: PullDirection) => {
    pullPieces(direction);
    setTimeout(
      () => logic.nextTurn(),
      PIECE_DROP_DURATION + BOARD_COLOR_CHANGE_DURATION
    );
  };

  const pullLeft = Gesture.Fling()
    .direction(Directions.LEFT)
    .onStart(() => {
      runOnJS(executePull)("left");
    });

  const pullRight = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onStart(() => {
      runOnJS(executePull)("right");
    });

  const pullUp = Gesture.Fling()
    .direction(Directions.UP)
    .onStart(() => {
      runOnJS(executePull)("up");
    });

  const pullDown = Gesture.Fling()
    .direction(Directions.DOWN)
    .onStart(() => {
      runOnJS(executePull)("down");
    });

  const pullGestures = Gesture.Exclusive(pullLeft, pullRight, pullUp, pullDown);

  const rotation = useSharedValue(0);

  function handleRotate(direction: "clockwise" | "counterclockwise") {
    const delta = direction === "clockwise" ? 90 : -90;

    rotation.value = withTiming(
      rotation.value + delta,
      { duration: 500 },
      () => {
        // Normalize rotation between 0–360
        rotation.value = (rotation.value + 360) % 360;
        // Update board logic to match rotation
        // runOnJS(updateBoardLogic)(direction);
      }
    );

    onRotate?.(direction);
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: 1 }],
  }));

  const boardGestures = Gesture.Exclusive(pullGestures);
  return (
    <GestureDetector gesture={boardGestures}>
      <Animated.View className={className} style={animatedStyle}>
        {Array.from({ length: BOARD_SIZE }).map((_, row) => (
          <View key={row} style={styles.row}>
            {Array.from({ length: BOARD_SIZE }).map((_, col) => {
              const id = `${row}-${col}`;
              if (isCornerPosition(row, col)) {
                return <Corner key={id} id={id} type="corner" />;
              } else if (isSlotPosition(row, col)) {
                return <Slot key={id} id={id} type="slot" />;
              }
              return <Space key={id} id={id} type="space" />;
            })}
          </View>
        ))}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    height: BASE_CELL_SIZE,
  },
});

export default Board;
