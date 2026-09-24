import { PIECE_RADIUS } from "@/constants/gameElements";
import {
  MOVE_IN_PROGRESS_DROP,
  TURN_CHANGE_COMMIT_DELAY_MS,
  TURN_CHANGE_SETTLE_BUFFER_MS,
} from "@/constants/logic";
import { useGameSession } from "@/context/GameSessionContext";
import { usePlayfieldFrameOptional } from "@/context/PlayfieldFrameContext";
import { useLayout } from "@/context/LayoutContext";
import { useSettings } from "@/context/SettingsContext";
import { useUi } from "@/context/UiContext";
import { applyGravity, Direction, Team } from "@/engine";
import React, { memo, useCallback, useEffect, useRef } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, withTiming } from "react-native-reanimated";

type GravityGestureLayerProps = {
  children: React.ReactNode;
  className?: string;
  pullRef?: React.MutableRefObject<((direction: Direction) => void) | null>;
};

const VELOCITY_THRESHOLD = 600;
export const PREVIEW_HOLD_MS = 200;
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

function resolvePreviewGravityDirection(pullDirection: Direction): Direction {
  switch (pullDirection) {
    case Direction.Up:
      return Direction.Down;
    case Direction.Down:
      return Direction.Up;
    case Direction.Left:
      return Direction.Right;
    case Direction.Right:
      return Direction.Left;
  }
}

const GravityGestureLayer: React.FC<GravityGestureLayerProps> = ({
  children,
  className,
  pullRef,
}) => {
  const { mode, gameState, getSessionSnapshot, shiftGravity, pieceAnims, resetCurrentGame, moves, cancelPendingMoves } =
    useGameSession();
  const computerTurn = mode === "onePlayer" && gameState.currentTeam === Team.Two && gameState.status === "playing";
  const { spaces } = useLayout();
  const playfield = usePlayfieldFrameOptional();
  const { shiftPreviews } = useSettings();
  const {
    moveInProgress,
    setMoveInProgress,
    setGravityAnimating,
    setIsPreviewingGravity,
    setGravityPreviewBoard,
    gravityPullEnabled,
  } = useUi();
  const pending = useRef(new Set<() => void>());
  const mounted = useRef(false);
  const schedule = useCallback((callback: () => void, delayMs: number) => {
    const cancel = moves.schedule(() => { pending.current.delete(cancel); callback(); }, delayMs);
    pending.current.add(cancel);
  }, [moves]);
  useEffect(() => {
    const scheduled = pending.current;
    mounted.current = true;
    return () => {
      mounted.current = false;
      for (const cancel of scheduled) cancel();
      scheduled.clear();
      cancelPendingMoves();
    };
  }, [cancelPendingMoves]);

  // Native gesture callbacks can arrive after a turn, reset or navigation.
  // Reject the old board before starting either an animation or a preview.
  const isCurrentPosition = useCallback(() => mounted.current &&
    getSessionSnapshot().gameState === gameState, [getSessionSnapshot, gameState]);

  const executePull = useCallback(
    (direction: Direction) => {
      if (!isCurrentPosition() || moves.getPhase() !== null) return;
      if (!gravityPullEnabled) return;

      if (gameState.status === "finished") {
        resetCurrentGame();
        return;
      }

      if (!moves.begin("gravity")) return;

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
            anim.translateX.set(withTiming(targetX, {
              duration: isVertical
                ? GRAVITY_CROSS_AXIS_MS
                : GRAVITY_DROP_AXIS_MS,
              easing: isVertical ? Easing.linear : Easing.bounce,
            }));
            anim.translateY.set(withTiming(targetY, {
              duration: isVertical
                ? GRAVITY_DROP_AXIS_MS
                : GRAVITY_CROSS_AXIS_MS,
              easing: isVertical ? Easing.bounce : Easing.linear,
            }));
          }
        }
      }

      schedule(() => {
        shiftGravity(direction);
      }, TURN_CHANGE_COMMIT_DELAY_MS);

      schedule(
        () => {
          moves.finish();
          setMoveInProgress(false);
          setGravityAnimating(false);
        },
        Math.max(
          MOVE_IN_PROGRESS_DROP,
          TURN_CHANGE_COMMIT_DELAY_MS + TURN_CHANGE_SETTLE_BUFFER_MS,
        ),
      );
    },
    [
      schedule,
      isCurrentPosition,
      moves,
      gameState.status,
      gameState.board,
      shiftGravity,
      resetCurrentGame,
      pieceAnims,
      spaces,
      setMoveInProgress,
      setGravityAnimating,
      gravityPullEnabled,
    ],
  );

  useEffect(() => {
    if (pullRef) pullRef.current = executePull;
    return () => {
      if (pullRef?.current === executePull) pullRef.current = null;
    };
  }, [pullRef, executePull]);

  const handleFling = useCallback(
    (direction: Direction) => {
      if (!isCurrentPosition() || moves.getPhase() !== null) return;
      if (computerTurn) return;
      if (!gravityPullEnabled) return;
      if (moveInProgress) return;
      if (gameState.status === "playing") {
        executePull(direction);
      } else if (gameState.status === "finished") {
        resetCurrentGame();
      }
    },
    [
      computerTurn,
      isCurrentPosition,
      moves,
      gravityPullEnabled,
      moveInProgress,
      gameState.status,
      executePull,
      resetCurrentGame,
    ],
  );

  const previewForPullDirection = useCallback(
    (pullDirection: Direction) => {
      if (!isCurrentPosition() || moves.getPhase() !== null) return;
      if (!gravityPullEnabled) {
        setIsPreviewingGravity(false);
        setGravityPreviewBoard(null);
        return;
      }
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

      const { board, moves: pieceMoves } = applyGravity(
        gameState.board,
        resolvePreviewGravityDirection(pullDirection),
      );
      if (pieceMoves.length === 0) {
        setIsPreviewingGravity(false);
        setGravityPreviewBoard(null);
        return;
      }

      setIsPreviewingGravity(true);
      setGravityPreviewBoard({ ...board });
    },
    [
      shiftPreviews,
      isCurrentPosition,
      moves,
      gameState.status,
      gameState.board,
      setIsPreviewingGravity,
      setGravityPreviewBoard,
      gravityPullEnabled,
    ],
  );

  const clearPreview = useCallback(() => {
    setIsPreviewingGravity(false);
    setGravityPreviewBoard(null);
  }, [setIsPreviewingGravity, setGravityPreviewBoard]);

  useEffect(() => {
    if (!shiftPreviews || !gravityPullEnabled) {
      clearPreview();
    }
  }, [shiftPreviews, gravityPullEnabled, clearPreview]);

  /* eslint-disable react-hooks/refs -- Gesture Handler registers callbacks; it does not invoke them during render. */
  const holdPreview = Gesture.LongPress()
    .runOnJS(true)
    .enabled(gravityPullEnabled && !computerTurn)
    .minDuration(PREVIEW_HOLD_MS)
    .onStart((event) => {
      if (!gravityPullEnabled) {
        clearPreview();
        return;
      }
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

      const ox = playfield?.windowOriginRef.current.x ?? 0;
      const oy = playfield?.windowOriginRef.current.y ?? 0;
      const pointerX = event.absoluteX - ox;
      const pointerY = event.absoluteY - oy;
      const inBounds =
        pointerX >= minX &&
        pointerX <= boardMaxX &&
        pointerY >= minY &&
        pointerY <= boardMaxY;
      if (!inBounds) {
        clearPreview();
        return;
      }

      const localX = pointerX - minX;
      const localY = pointerY - minY;
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
    .enabled(gravityPullEnabled && !computerTurn)
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
  /* eslint-enable react-hooks/refs */

  return (
    <GestureDetector gesture={Gesture.Simultaneous(holdPreview, panFling)}>
      <Animated.View className={className} style={{ position: "relative" }}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

export default memo(GravityGestureLayer);
