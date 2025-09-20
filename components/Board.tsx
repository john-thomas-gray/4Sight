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
import Animated from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
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
      const entry = Object.entries(logic.boardPieceLocations).find(
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
      logic.checkGameFinished(logic.boardPieceLocations);
    }, 300);
    return () => {
      clearTimeout(timer.current);
      timer.current = 0;
    };
  }, [logic.boardPieceLocations, layout.spaces]);
  const isMoving = useRef(false);

  const executePull = (direction: Direction) => {
    if (
      logic.gameState === GameState.Finished ||
      logic.gameState === GameState.Ready ||
      isMoving.current
    )
      return;

    isMoving.current = true;

    pullPieces(direction);

    setTimeout(() => {
      isMoving.current = false;
      // !@# magic number
    }, 1500);
  };

  const handleFling = (direction: Direction, gameState: GameState) => {
    if (gameState === GameState.Playing) {
      executePull(direction);
    } else if (gameState === GameState.PostGame) {
      logic.resetGame(logic.playersTurn, false);
    }
  };

  const flingLeft = Gesture.Fling()
    .direction(Directions.LEFT)
    .onStart(() => {
      scheduleOnRN(handleFling, Direction.Left, logic.gameState);
    });

  const flingRight = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onStart(() => {
      scheduleOnRN(handleFling, Direction.Right, logic.gameState);
    });

  const flingUp = Gesture.Fling()
    .direction(Directions.UP)
    .onStart(() => {
      scheduleOnRN(handleFling, Direction.Up, logic.gameState);
    });

  const flingDown = Gesture.Fling()
    .direction(Directions.DOWN)
    .onStart(() => {
      scheduleOnRN(handleFling, Direction.Down, logic.gameState);
    });

  const flingGestures = Gesture.Exclusive(
    flingLeft,
    flingRight,
    flingUp,
    flingDown
  );

  const gravityPreview = (side: "up" | "down" | "left" | "right") => {
    const opposite =
      side === "up"
        ? "down"
        : side === "down"
        ? "up"
        : side === "left"
        ? "right"
        : "left";
    console.log(opposite);
  };

  const lpUp = Gesture.LongPress().onEnd((e, success) => {
    "worklet";
    if (!success) return;
    const targets: [number, number][] = [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [0, 5],
      [0, 6],
      [0, 7],
      [1, 2],
      [1, 3],
      [1, 4],
      [1, 5],
      [1, 6],
      [2, 3],
      [2, 4],
      [2, 5],
      [3, 4],
    ];
    const { x, y } = e;
    for (const [row, col] of targets) {
      const top = row * BASE_CELL_SIZE;
      const left = col * BASE_CELL_SIZE;
      const bottom = top + BASE_CELL_SIZE;
      const right = left + BASE_CELL_SIZE;
      if (x >= left && x <= right && y >= top && y <= bottom) {
        scheduleOnRN(gravityPreview, "up");
        break;
      }
    }
  });

  const lpDown = Gesture.LongPress().onEnd((e, success) => {
    "worklet";
    if (!success) return;
    const targets: [number, number][] = [
      [8, 1],
      [8, 2],
      [8, 3],
      [8, 4],
      [8, 5],
      [8, 6],
      [8, 7],
      [7, 2],
      [7, 3],
      [7, 4],
      [7, 5],
      [7, 6],
      [6, 3],
      [6, 4],
      [6, 5],
      [5, 4],
    ];
    const { x, y } = e;
    for (const [row, col] of targets) {
      const top = row * BASE_CELL_SIZE;
      const left = col * BASE_CELL_SIZE;
      const bottom = top + BASE_CELL_SIZE;
      const right = left + BASE_CELL_SIZE;
      if (x >= left && x <= right && y >= top && y <= bottom) {
        scheduleOnRN(gravityPreview, "down");
        break;
      }
    }
  });

  const lpLeft = Gesture.LongPress().onEnd((e, success) => {
    "worklet";
    if (!success) return;
    const targets: [number, number][] = [
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
      [5, 0],
      [6, 0],
      [7, 0],
      [2, 1],
      [3, 1],
      [4, 1],
      [5, 1],
      [6, 1],
      [3, 2],
      [4, 2],
      [5, 2],
      [4, 3],
    ];
    const { x, y } = e;
    for (const [row, col] of targets) {
      const top = row * BASE_CELL_SIZE;
      const left = col * BASE_CELL_SIZE;
      const bottom = top + BASE_CELL_SIZE;
      const right = left + BASE_CELL_SIZE;
      if (x >= left && x <= right && y >= top && y <= bottom) {
        scheduleOnRN(gravityPreview, "left");
        break;
      }
    }
  });

  const lpRight = Gesture.LongPress().onEnd((e, success) => {
    "worklet";
    if (!success) return;
    const targets: [number, number][] = [
      [1, 8],
      [2, 8],
      [3, 8],
      [4, 8],
      [5, 8],
      [6, 8],
      [7, 8],
      [2, 7],
      [3, 7],
      [4, 7],
      [5, 7],
      [6, 7],
      [3, 6],
      [4, 6],
      [5, 6],
      [4, 5],
    ];
    const { x, y } = e;
    for (const [row, col] of targets) {
      const top = row * BASE_CELL_SIZE;
      const left = col * BASE_CELL_SIZE;
      const bottom = top + BASE_CELL_SIZE;
      const right = left + BASE_CELL_SIZE;
      if (x >= left && x <= right && y >= top && y <= bottom) {
        scheduleOnRN(gravityPreview, "right");
        break;
      }
    }
  });

  const longPressGestures = Gesture.Simultaneous(lpUp, lpDown, lpLeft, lpRight);
  const boardGestures = Gesture.Exclusive(longPressGestures, flingGestures);

  return (
    <GestureDetector gesture={boardGestures}>
      <Animated.View className={className} style={{ position: "relative" }}>
        {/* Long-press capture zones on each side */}
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
