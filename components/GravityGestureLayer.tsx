import { PIECE_RADIUS } from "@/constants/gameElements";
import { MOVE_IN_PROGRESS_DROP } from "@/constants/logic";
import { useGameSession } from "@/context/GameSessionContext";
import { useLayout } from "@/context/LayoutContext";
import { useUi } from "@/context/UiContext";
import { Direction } from "@/engine";
import React, { memo, useCallback, useEffect, useRef } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

type GravityGestureLayerProps = {
  children: React.ReactNode;
  className?: string;
};

const VELOCITY_THRESHOLD = 600;

const GravityGestureLayer: React.FC<GravityGestureLayerProps> = ({
  children,
  className,
}) => {
  const { gameState, shiftGravity, pieceAnims, resetCurrentGame } =
    useGameSession();
  const { spaces } = useLayout();
  const { setMoveInProgress, setGravityAnimating } = useUi();
  const gravityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (gravityTimeoutRef.current) clearTimeout(gravityTimeoutRef.current);
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

      const result = shiftGravity(direction);
      const gravityEvent = result.events.find(
        (e) => e.type === "gravity_shifted"
      );

      if (gravityEvent && gravityEvent.type === "gravity_shifted") {
        for (const move of gravityEvent.moves) {
          const anim = pieceAnims[move.pieceId];
          const targetKey = `${move.to.row}-${move.to.col}`;
          const spaceLayout = spaces[targetKey];
          if (anim && spaceLayout) {
            anim.translateX.value =
              spaceLayout.pageX + spaceLayout.width / 2 - PIECE_RADIUS;
            anim.translateY.value =
              spaceLayout.pageY + spaceLayout.height / 2 - PIECE_RADIUS;
          }
        }
      }

      if (gravityTimeoutRef.current) clearTimeout(gravityTimeoutRef.current);
      gravityTimeoutRef.current = setTimeout(() => {
        setMoveInProgress(false);
        setGravityAnimating(false);
        gravityTimeoutRef.current = null;
      }, MOVE_IN_PROGRESS_DROP);
    },
    [
      gameState.status,
      shiftGravity,
      resetCurrentGame,
      pieceAnims,
      spaces,
      setMoveInProgress,
      setGravityAnimating,
    ]
  );

  const handleFling = useCallback(
    (direction: Direction) => {
      if (gameState.status === "playing") {
        executePull(direction);
      } else if (gameState.status === "finished") {
        resetCurrentGame();
      }
    },
    [gameState.status, executePull, resetCurrentGame]
  );

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
    <GestureDetector gesture={panFling}>
      <Animated.View className={className} style={{ position: "relative" }}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

export default memo(GravityGestureLayer);
