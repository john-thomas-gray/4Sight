import { useEffect } from "react";
import {
  SharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const animationLoopDuration = 5000;

type LoadingTextAnimation = {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  fontSize: SharedValue<number>;
};

export const useLoadingMoveTextAnimation = ({
  translateX,
  translateY,
  fontSize,
}: LoadingTextAnimation) => {
  useEffect(() => {
    translateX.value = withRepeat(
      withDelay(
        animationLoopDuration * 0.2,
        withSequence(
          withTiming(-45, { duration: animationLoopDuration * 0.1 }),
          withDelay(
            animationLoopDuration * 0.5,
            withTiming(0, { duration: animationLoopDuration * 0.2 })
          )
        )
      ),
      -1
    );
  }, [translateX]);
};

export const useLoadingFontSizeAnimation = ({
  fontSize,
}: {
  fontSize: SharedValue<number>;
}) => {
  fontSize.value = withRepeat(
    withSequence(
      withDelay(
        animationLoopDuration * 0.3,
        withSequence(
          withTiming(80, { duration: animationLoopDuration * 0.05 }),
          withTiming(76, { duration: animationLoopDuration * 0.05 }),
          withDelay(
            animationLoopDuration * 0.4,
            withTiming(76, { duration: animationLoopDuration * 0.2 })
          )
        )
      )
    ),
    -1
  );
};

export const useLoadingTextAnimations = ({
  translateX,
  translateY,
  fontSize,
}: LoadingTextAnimation) => {
  useLoadingMoveTextAnimation({ translateX, translateY, fontSize });
  useLoadingFontSizeAnimation({ fontSize });
};

export const usePieceLoadingAnimation = ({
  translateX,
  translateY,
  direction,
  rotation,
  duration,
}: {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  direction: "left" | "right" | "up" | "down";
  rotation: number;
  duration: number;
}) => {
  useEffect(() => {
    const screenWidth = 400; // Approximate screen width
    const offScreenX = direction === "right" ? screenWidth + 200 : -200;

    // Start from off-screen
    translateX.value = offScreenX;
    translateY.value = 0;

    // Animate to center
    translateX.value = withTiming(0, { duration });
    translateY.value = withTiming(0, { duration });
  }, [translateX, translateY, direction, rotation, duration]);
};
