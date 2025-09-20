import animateGravity from "@/animations/animateGravity";
import {
  BASE_CELL_SIZE,
  BOARD_SIZE,
  BOARD_SIZE_ZERO_IDX,
} from "@/constants/gameElements";
import { useGameContext } from "@/context/GameContext";
import { useGravity } from "@/hooks/useGravity";
import { CellType, Direction, Team } from "@/types/board";
import { GameState } from "@/types/logic";
import React, { useLayoutEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import Corner from "./Corner";
import PiecePreview from "./PiecePreview";
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
  const boardRef = useRef<View>(null);
  const [boardOffset, setBoardOffset] = React.useState({ x: 0, y: 0 });

  const measureBoard = () => {
    boardRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setBoardOffset({ x: pageX, y: pageY });
    });
  };
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

  // Pan-based fling with velocity threshold to mimic Gesture.Fling
  const VELOCITY_THRESHOLD = 800;
  const panFling = Gesture.Pan().onEnd((e) => {
    "worklet";
    const absVX = Math.abs(e.velocityX);
    const absVY = Math.abs(e.velocityY);
    if (absVX < VELOCITY_THRESHOLD && absVY < VELOCITY_THRESHOLD) return;

    let dir: Direction;
    if (absVX >= absVY) {
      dir = e.velocityX > 0 ? Direction.Right : Direction.Left;
    } else {
      dir = e.velocityY > 0 ? Direction.Down : Direction.Up;
    }
    scheduleOnRN(handleFling, dir, logic.gameState);
  });

  const [gravityPreviewPieces, setGravityPreviewPieces] = React.useState<
    { spaceId: string; team: Team }[] | null
  >(null);

  const computePreview = (direction: Direction) => {
    const updated = { ...logic.boardPieceLocations } as Record<string, string>;
    let hasMoves = false;

    if (direction === Direction.Up) {
      for (let row = 2; row <= 7; row++) {
        for (let col = 1; col <= 7; col++) {
          const currentSpaceId = `${row}-${col}`;
          if (updated[currentSpaceId]) {
            let targetRow = row;
            while (targetRow > 1 && !updated[`${targetRow - 1}-${col}`]) {
              targetRow--;
            }
            const targetSpaceId = `${targetRow}-${col}`;
            if (targetSpaceId !== currentSpaceId) {
              hasMoves = true;
              updated[targetSpaceId] = updated[currentSpaceId];
              delete updated[currentSpaceId];
            }
          }
        }
      }
    } else if (direction === Direction.Down) {
      for (let row = 6; row >= 1; row--) {
        for (let col = 1; col <= 7; col++) {
          const currentSpaceId = `${row}-${col}`;
          if (updated[currentSpaceId]) {
            let targetRow = row;
            while (targetRow < 7 && !updated[`${targetRow + 1}-${col}`]) {
              targetRow++;
            }
            const targetSpaceId = `${targetRow}-${col}`;
            if (targetSpaceId !== currentSpaceId) {
              hasMoves = true;
              updated[targetSpaceId] = updated[currentSpaceId];
              delete updated[currentSpaceId];
            }
          }
        }
      }
    } else if (direction === Direction.Left) {
      for (let col = 2; col <= 7; col++) {
        for (let row = 1; row <= 7; row++) {
          const currentSpaceId = `${row}-${col}`;
          if (updated[currentSpaceId]) {
            let targetCol = col;
            while (targetCol > 1 && !updated[`${row}-${targetCol - 1}`]) {
              targetCol--;
            }
            const targetSpaceId = `${row}-${targetCol}`;
            if (targetSpaceId !== currentSpaceId) {
              hasMoves = true;
              updated[targetSpaceId] = updated[currentSpaceId];
              delete updated[currentSpaceId];
            }
          }
        }
      }
    } else if (direction === Direction.Right) {
      for (let col = 6; col >= 1; col--) {
        for (let row = 1; row <= 7; row++) {
          const currentSpaceId = `${row}-${col}`;
          if (updated[currentSpaceId]) {
            let targetCol = col;
            while (targetCol < 7 && !updated[`${row}-${targetCol + 1}`]) {
              targetCol++;
            }
            const targetSpaceId = `${row}-${targetCol}`;
            if (targetSpaceId !== currentSpaceId) {
              hasMoves = true;
              updated[targetSpaceId] = updated[currentSpaceId];
              delete updated[currentSpaceId];
            }
          }
        }
      }
    }

    const result: { spaceId: string; team: Team }[] = [];
    Object.entries(updated).forEach(([spaceId, pieceId]) => {
      const team = logic.pieces[pieceId]?.team ?? Team.Unassigned;
      result.push({ spaceId, team });
    });
    return { previews: result, hasMoves };
  };

  const gravityPreview = (side: "up" | "down" | "left" | "right") => {
    const opposite: Direction =
      side === "up"
        ? Direction.Down
        : side === "down"
        ? Direction.Up
        : side === "left"
        ? Direction.Right
        : Direction.Left;
    const { previews, hasMoves } = computePreview(opposite);
    if (!hasMoves) {
      setGravityPreviewPieces(null);
      logic.setPreviewHiddenPieces({});
      return;
    }
    const toHide: Record<string, boolean> = {};
    Object.keys(logic.boardPieceLocations).forEach((spaceId) => {
      const pieceId = logic.boardPieceLocations[spaceId];
      if (previews.find((p) => p.spaceId === spaceId)) {
        toHide[pieceId] = true;
      }
    });
    setGravityPreviewPieces(previews);
    logic.setPreviewHiddenPieces(toHide);
  };

  const lpUp = Gesture.LongPress()
    .onStart((e) => {
      "worklet";
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
    })
    .onFinalize(() => {
      "worklet";
      scheduleOnRN(setGravityPreviewPieces, null);
      scheduleOnRN(logic.setPreviewHiddenPieces, {});
    });

  const lpDown = Gesture.LongPress()
    .onStart((e) => {
      "worklet";
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
    })
    .onFinalize(() => {
      "worklet";
      scheduleOnRN(setGravityPreviewPieces, null);
      scheduleOnRN(logic.setPreviewHiddenPieces, {});
    });

  const lpLeft = Gesture.LongPress()
    .onStart((e) => {
      "worklet";
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
    })
    .onFinalize(() => {
      "worklet";
      scheduleOnRN(setGravityPreviewPieces, null);
      scheduleOnRN(logic.setPreviewHiddenPieces, {});
    });

  const lpRight = Gesture.LongPress()
    .onStart((e) => {
      "worklet";
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
    })
    .onFinalize(() => {
      "worklet";
      scheduleOnRN(setGravityPreviewPieces, null);
      scheduleOnRN(logic.setPreviewHiddenPieces, {});
    });

  const longPressGestures = Gesture.Simultaneous(lpUp, lpDown, lpLeft, lpRight);
  const boardGestures = Gesture.Simultaneous(longPressGestures, panFling);

  return (
    <GestureDetector gesture={boardGestures}>
      <Animated.View
        ref={boardRef}
        onLayout={measureBoard}
        className={className}
        style={{ position: "relative" }}
      >
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
        {gravityPreviewPieces &&
          gravityPreviewPieces.map(({ spaceId, team }) => (
            <PiecePreview
              key={`${spaceId}-${team}`}
              spaceId={spaceId}
              team={team}
              offsetX={boardOffset.x}
              offsetY={boardOffset.y}
            />
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
