import animateGravity from "@/animations/animateGravity";
import {
  BASE_CELL_SIZE,
  BOARD_SIZE,
  BOARD_SIZE_ZERO_IDX,
} from "@/constants/gameElements";
import { useGameContext } from "@/context/GameContext";
import { useGravity } from "@/hooks/useGravity";
import { CellType, Direction } from "@/types/board";
import { GameState } from "@/types/logic";
import React, { useLayoutEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import {
  Directions,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, { runOnJS } from "react-native-reanimated";
import Corner from "./Corner";
import Slot from "./Slot";
import Space from "./Space";

type BoardProps = {
  className?: string;
  onRotate?: (
    direction: "clockwise" | "gravityAnimationTriggererclockwise"
  ) => void;
};

const Board = ({ className, onRotate }: BoardProps) => {
  const { logic, layout } = useGameContext();

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
  const firstTurn = useRef(true);
  const timer = useRef(0);
  // !@# Should only fire when we actually pull gravity
  useLayoutEffect(() => {
    if (timer.current > 0) return;
    Object.keys(logic.pieces).forEach((pieceId) => {
      const entry = Object.entries(layout.boardPieceLocations).find(
        ([, value]) => value === pieceId
      );
      if (entry) {
        const [spaceId] = entry;
        const animate = logic.pieceAnimations[pieceId];
        animateGravity({
          translateX: animate.translateX,
          translateY: animate.translateY,
          spaceLayout: layout.spaces[spaceId],
        });
      }
    });
    timer.current = setTimeout(() => {
      if (firstTurn.current) {
        logic.setGameState(GameState.Ready);
        firstTurn.current = false;
        return;
      }
      console.log("checkgamefinished");
      logic.checkGameFinished(layout.boardPieceLocations);
    }, 300);
    return () => {
      clearTimeout(timer.current);
      timer.current = 0;
    };
  }, [layout.boardPieceLocations]);
  const isMoving = useRef(false)
  const executePull = (direction: Direction) => {
    if (
      logic.gameState === GameState.Finished ||
      logic.gameState === GameState.Ready ||
      isMoving.current
    )
      return;

    isMoving.current = true

    pullPieces(direction);

    setTimeout(() => {isMoving.current = false}, 1500)
  };

  const pullLeft = Gesture.Fling()
    .direction(Directions.LEFT)
    .onStart(() => {
      runOnJS(executePull)(Direction.Left);
    });

  const pullRight = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onStart(() => {
      runOnJS(executePull)(Direction.Right);
    });

  const pullUp = Gesture.Fling()
    .direction(Directions.UP)
    .onStart(() => {
      runOnJS(executePull)(Direction.Up);
    });

  const pullDown = Gesture.Fling()
    .direction(Directions.DOWN)
    .onStart(() => {
      runOnJS(executePull)(Direction.Down);
    });

  const pullGestures = Gesture.Exclusive(pullLeft, pullRight, pullUp, pullDown);
  const boardGestures = Gesture.Exclusive(pullGestures);

  return (
    <GestureDetector gesture={boardGestures}>
      <Animated.View className={className}>
        {Array.from({ length: BOARD_SIZE }).map((_, row) => (
          <View key={row} style={styles.row}>
            {Array.from({ length: BOARD_SIZE }).map((_, col) => {
              const id = `${row}-${col}`;
              if (isCornerPosition(row, col)) {
                return <Corner key={id} id={id} type={CellType.Corner} />;
              } else if (isSlotPosition(row, col)) {
                return <Slot key={id} id={id} type={CellType.Slot} />;
              }
              return <Space key={id} id={id} type={CellType.Space} />;
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
