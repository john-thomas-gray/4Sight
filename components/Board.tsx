import animateGravity from "@/animations/animateGravity";
import {
  BASE_CELL_SIZE,
  BOARD_SIZE,
  BOARD_SIZE_ZERO_IDX,
} from "@/constants/gameElements";
import { MOVE_IN_PROGRESS_DROP } from "@/constants/logic";
import { useGameContext } from "@/context/GameContext";
import {
  useLogicAnimations,
  useLogicBoardState,
  useLogicGameFlow,
  useLogicInteractions,
} from "@/context/LogicContext";
import { useGravity } from "@/hooks/useGravity";
import { CellType, Direction, Team } from "@/types/board";
import { GameState } from "@/types/logic";
import React, { memo, useEffect, useLayoutEffect, useRef } from "react";
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

const Board = ({ className }: BoardProps) => {
  const { layout, settings } = useGameContext();
  const shiftPreviews = settings.shiftPreviews;
  const { boardPieceLocations, pieces, wellPieceLocations } =
    useLogicBoardState();
  const {
    pieceAnimSharedValues,
    setIsPreviewingGravity,
    setGravityAnimating,
    setPreviewPieces,
  } = useLogicAnimations();
  const { gameState, checkGameFinished, resetGame } = useLogicGameFlow();
  const { moveInProgress, setMoveInProgress, setMIP } = useLogicInteractions();

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

  const pullGravity = useGravity();
  const boardRef = useRef<View>(null);
  const [boardOffset, setBoardOffset] = React.useState({ x: 0, y: 0 });

  const measureBoardOffset = () => {
    boardRef.current?.measure((x, y, width, height, pageX, pageY) => {
      // Use page coordinates since spaces also use page coordinates
      setBoardOffset({ x: pageX, y: pageY });
    });
  };

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gravityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    if (!layout.layoutReady) return;
    if (timer.current) return;
    Object.keys(pieces).forEach((pieceId) => {
      const entry = Object.entries(boardPieceLocations).find(
        ([, value]) => value === pieceId
      );
      if (entry) {
        const [spaceId] = entry;
        const animate = pieceAnimSharedValues[pieceId];
        const spaceLayout = layout.spaces[spaceId];
        if (!animate || !spaceLayout) return;
        animateGravity({
          translateX: animate.translateX,
          translateY: animate.translateY,
          spaceLayout: layout.spaces[spaceId],
        });
      }
    });
    timer.current = setTimeout(() => {
      if (moveInProgress) {
        checkGameFinished(boardPieceLocations);
      }
      timer.current = null;
    }, 300);
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [boardPieceLocations]);

  const executePull = (direction: Direction) => {
    if (gameState === GameState.Finished) {
      resetGame();
      return;
    }
    if (gameState === GameState.Ready) return;

    setMIP({ setting: true });
    setMoveInProgress(true);
    setGravityAnimating(true);
    pullGravity(direction);

    if (gravityTimeoutRef.current) {
      clearTimeout(gravityTimeoutRef.current);
      gravityTimeoutRef.current = null;
    }

    gravityTimeoutRef.current = setTimeout(() => {
      setMoveInProgress(false);
      setGravityAnimating(false);
      // !@# magic number
      gravityTimeoutRef.current = null;
    }, MOVE_IN_PROGRESS_DROP);
  };

  const handleFling = (direction: Direction, gameState: GameState) => {
    if (gameState === GameState.Playing) {
      executePull(direction);
    } else if (gameState === GameState.Finished) {
      resetGame();
    }
  };

  const VELOCITY_THRESHOLD = 600;
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
    scheduleOnRN(handleFling, dir, gameState);
  });

  const [gravityPreviewPieces, setGravityPreviewPieces] = React.useState<
    { spaceId: string; team: Team }[] | null
  >(null);

  const computePreview = (direction: Direction) => {
    const updated = { ...boardPieceLocations } as Record<string, string>;
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
      const team = pieces[pieceId]?.team ?? Team.Unassigned;
      result.push({ spaceId, team });
    });
    return { previews: result, hasMoves };
  };

  const gravityPreview = (side: "up" | "down" | "left" | "right") => {
    if (
      !settings.shiftPreviews ||
      gameState !== GameState.Playing ||
      moveInProgress
    ) {
      setGravityPreviewPieces(null);
      setPreviewPieces({});
      return;
    }
    setMoveInProgress(true);

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
      setPreviewPieces({});
      return;
    }
    const toHide: Record<string, boolean> = {};
    const wellPieceIds = new Set<string>(
      Object.values(wellPieceLocations || {})
    );
    Object.keys(pieces).forEach((pieceId) => {
      toHide[pieceId] = !wellPieceIds.has(pieceId);
    });
    setGravityPreviewPieces(previews);
    setPreviewPieces(toHide);
  };

  const longPressDurationMS = 0;

  const lpUp = Gesture.LongPress()
    .minDuration(longPressDurationMS)
    .onStart((e) => {
      "worklet";
      if (shiftPreviews) scheduleOnRN(setIsPreviewingGravity, true);
      const targets: [number, number][] = [
        // [0, 0], /* * */ !@#
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
        [0, 5],
        [0, 6],
        [0, 7],
        // [1, 1] /* * */,
        [1, 2],
        [1, 3],
        [1, 4],
        [1, 5],
        [1, 6],
        // [1, 7] /* * */,
        // [2, 2] /* * */,
        [2, 3],
        [2, 4],
        [2, 5],
        // [2, 6] /* * */,
        [3, 4],
        // [4,4] /* one quarter */
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
      scheduleOnRN(setPreviewPieces, {});
      if (shiftPreviews) scheduleOnRN(setIsPreviewingGravity, false);
      if (moveInProgress) scheduleOnRN(setMIP, { setting: false, delay: 25 });
    });

  const lpDown = Gesture.LongPress()
    .minDuration(longPressDurationMS)
    .onStart((e) => {
      "worklet";
      if (shiftPreviews) scheduleOnRN(setIsPreviewingGravity, true);
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
      scheduleOnRN(setPreviewPieces, {});
      if (shiftPreviews) scheduleOnRN(setIsPreviewingGravity, false);
    });

  const lpLeft = Gesture.LongPress()
    .minDuration(longPressDurationMS)
    .onStart((e) => {
      "worklet";
      if (shiftPreviews) scheduleOnRN(setIsPreviewingGravity, true);
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
      scheduleOnRN(setPreviewPieces, {});
      if (shiftPreviews) scheduleOnRN(setIsPreviewingGravity, false);
    });

  const lpRight = Gesture.LongPress()
    .minDuration(longPressDurationMS)
    .onStart((e) => {
      "worklet";
      if (shiftPreviews) scheduleOnRN(setIsPreviewingGravity, true);
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
      scheduleOnRN(setPreviewPieces, {});
      if (shiftPreviews) scheduleOnRN(setIsPreviewingGravity, false);
    });

  useEffect(() => {
    return () => {
      if (gravityTimeoutRef.current) {
        clearTimeout(gravityTimeoutRef.current);
        gravityTimeoutRef.current = null;
      }
    };
  }, []);

  const longPressGestures = Gesture.Simultaneous(lpUp, lpDown, lpLeft, lpRight);
  const boardGestures = Gesture.Simultaneous(longPressGestures, panFling);

  return (
    <GestureDetector gesture={boardGestures}>
      <Animated.View
        ref={boardRef}
        onLayout={measureBoardOffset}
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

export default memo(Board);
