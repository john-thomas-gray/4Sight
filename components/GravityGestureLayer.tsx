import { PIECE_RADIUS } from "@/constants/gameElements";
import {
  MOVE_IN_PROGRESS_DROP,
  TURN_CHANGE_COMMIT_DELAY_MS,
  TURN_CHANGE_SETTLE_BUFFER_MS,
} from "@/constants/logic";
import { useGameSession } from "@/context/GameSessionContext";
import { useLayout } from "@/context/LayoutContext";
import { useSettings } from "@/context/SettingsContext";
import { useUi } from "@/context/UiContext";
import { applyGravity, Direction } from "@/engine";
import React, { memo, useCallback, useEffect, useRef } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, withTiming } from "react-native-reanimated";

type GravityGestureLayerProps = {
  children: React.ReactNode;
  className?: string;
};

const VELOCITY_THRESHOLD = 600;
const PREVIEW_HOLD_MS = 250;
const GRAVITY_DROP_AXIS_MS = 700;
const GRAVITY_CROSS_AXIS_MS = 320;

function resolvePullDirectionFromTriangleZone(
  localX: number,
  localY: number,
  boardSize: number,
): Direction {
  const onOrAboveDescending = localY <= localX;
  const onOrAboveAscending = localY <= boardSize - localX;

  if (onOrAboveDescending && onOrAboveAscending) return Direction.Up;
  if (onOrAboveDescending && !onOrAboveAscending) return Direction.Right;
  if (!onOrAboveDescending && onOrAboveAscending) return Direction.Left;
  return Direction.Down;
}

const GravityGestureLayer: React.FC<GravityGestureLayerProps> = ({
  children,
  className,
}) => {
  const { gameState, shiftGravity, pieceAnims, resetCurrentGame } =
    useGameSession();
  const { spaces } = useLayout();
  const { shiftPreviews } = useSettings();
  const {
    moveInProgress,
    setMoveInProgress,
    setGravityAnimating,
    setIsPreviewingGravity,
    setGravityPreviewBoard,
  } = useUi();
  const gravityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gravityCommitRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (gravityTimeoutRef.current) clearTimeout(gravityTimeoutRef.current);
      if (gravityCommitRef.current) clearTimeout(gravityCommitRef.current);
    };
  }, []);

  const executePull = useCallback(
    (direction: Direction) => {
      if (gameState.status === "finished") {
        resetCurrentGame();
        return;
      }

      setMoveInProgress(true);
      setGravityAnimating(true);

      const preview = applyGravity(gameState.board, direction);
      if (preview.moves.length > 0) {
        const isVertical =
          direction === Direction.Up || direction === Direction.Down;
        for (const move of preview.moves) {
          const anim = pieceAnims[move.pieceId];
          const targetKey = `${move.to.row}-${move.to.col}`;
          const spaceLayout = spaces[targetKey];
          if (anim && spaceLayout) {
            const targetX =
              spaceLayout.pageX + spaceLayout.width / 2 - PIECE_RADIUS;
            const targetY =
              spaceLayout.pageY + spaceLayout.height / 2 - PIECE_RADIUS;
            anim.translateX.value = withTiming(targetX, {
              duration: isVertical
                ? GRAVITY_CROSS_AXIS_MS
                : GRAVITY_DROP_AXIS_MS,
              easing: isVertical ? Easing.linear : Easing.bounce,
            });
            anim.translateY.value = withTiming(targetY, {
              duration: isVertical
                ? GRAVITY_DROP_AXIS_MS
                : GRAVITY_CROSS_AXIS_MS,
              easing: isVertical ? Easing.bounce : Easing.linear,
            });
          }
        }
      }

      if (gravityCommitRef.current) clearTimeout(gravityCommitRef.current);
      gravityCommitRef.current = setTimeout(() => {
        shiftGravity(direction);
        gravityCommitRef.current = null;
      }, TURN_CHANGE_COMMIT_DELAY_MS);

      if (gravityTimeoutRef.current) clearTimeout(gravityTimeoutRef.current);
      gravityTimeoutRef.current = setTimeout(
        () => {
          setMoveInProgress(false);
          setGravityAnimating(false);
          gravityTimeoutRef.current = null;
        },
        Math.max(
          MOVE_IN_PROGRESS_DROP,
          TURN_CHANGE_COMMIT_DELAY_MS + TURN_CHANGE_SETTLE_BUFFER_MS,
        ),
      );
    },
    [
      gameState.status,
      gameState.board,
      shiftGravity,
      resetCurrentGame,
      pieceAnims,
      spaces,
      setMoveInProgress,
      setGravityAnimating,
    ],
  );

  const handleFling = useCallback(
    (direction: Direction) => {
      if (moveInProgress) return;
      if (gameState.status === "playing") {
        executePull(direction);
      } else if (gameState.status === "finished") {
        resetCurrentGame();
      }
    },
    [moveInProgress, gameState.status, executePull, resetCurrentGame],
  );

  const previewForPullDirection = useCallback(
    (pullDirection: Direction) => {
      if (!shiftPreviews) {
        setIsPreviewingGravity(false);
        setGravityPreviewBoard(null);
        return;
      }
      if (gameState.status !== "playing") {
        setIsPreviewingGravity(false);
        setGravityPreviewBoard(null);
        return;
      }

      const fallDirection =
        pullDirection === Direction.Up
          ? Direction.Down
          : pullDirection === Direction.Down
            ? Direction.Up
            : pullDirection === Direction.Left
              ? Direction.Right
              : Direction.Left;
      const { board, moves } = applyGravity(gameState.board, fallDirection);
      if (moves.length === 0) {
        setIsPreviewingGravity(false);
        setGravityPreviewBoard(null);
        return;
      }

      setIsPreviewingGravity(true);
      setGravityPreviewBoard({ ...board });
    },
    [
      shiftPreviews,
      gameState.status,
      gameState.board,
      setIsPreviewingGravity,
      setGravityPreviewBoard,
    ],
  );

  const clearPreview = useCallback(() => {
    setIsPreviewingGravity(false);
    setGravityPreviewBoard(null);
  }, [setIsPreviewingGravity, setGravityPreviewBoard]);

  useEffect(() => {
    if (!shiftPreviews) {
      clearPreview();
    }
  }, [shiftPreviews, clearPreview]);

  const holdPreview = Gesture.LongPress()
    .runOnJS(true)
    .minDuration(PREVIEW_HOLD_MS)
    .onStart((event) => {
      if (moveInProgress) {
        clearPreview();
        return;
      }
      if (!shiftPreviews) {
        clearPreview();
        return;
      }
      const allSpaceLayouts = Object.values(spaces);
      if (allSpaceLayouts.length === 0) {
        clearPreview();
        return;
      }

      const minX = Math.min(...allSpaceLayouts.map((s) => s.pageX));
      const minY = Math.min(...allSpaceLayouts.map((s) => s.pageY));
      const maxX = Math.max(...allSpaceLayouts.map((s) => s.pageX + s.width));
      const maxY = Math.max(...allSpaceLayouts.map((s) => s.pageY + s.height));
      const width = maxX - minX;
      const height = maxY - minY;
      const boardSize = Math.min(width, height);
      const boardMaxX = minX + boardSize;
      const boardMaxY = minY + boardSize;

      const x = event.absoluteX;
      const y = event.absoluteY;
      const inBounds =
        x >= minX && x <= boardMaxX && y >= minY && y <= boardMaxY;
      if (!inBounds) {
        clearPreview();
        return;
      }

      const localX = x - minX;
      const localY = y - minY;
      const pullDirection = resolvePullDirectionFromTriangleZone(
        localX,
        localY,
        boardSize,
      );
      previewForPullDirection(pullDirection);
    })
    .onFinalize(() => {
      clearPreview();
    });

  const panFling = Gesture.Pan()
    .runOnJS(true)
    .onEnd((e) => {
      const absVX = Math.abs(e.velocityX);
      const absVY = Math.abs(e.velocityY);
      if (absVX < VELOCITY_THRESHOLD && absVY < VELOCITY_THRESHOLD) return;

      let dir: Direction;
      if (absVX >= absVY) {
        dir = e.velocityX > 0 ? Direction.Right : Direction.Left;
      } else {
        dir = e.velocityY > 0 ? Direction.Down : Direction.Up;
      }
      handleFling(dir);
    });

  return (
    <GestureDetector gesture={Gesture.Simultaneous(holdPreview, panFling)}>
      <Animated.View className={className} style={{ position: "relative" }}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

export default memo(GravityGestureLayer);
