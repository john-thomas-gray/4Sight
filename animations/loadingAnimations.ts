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
  xStart,
  yStart,
  xEnd,
  yEnd,
  direction,
  rotation,
  startOffset,
}: {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  xStart: number;
  yStart: number;
  xEnd: number;
  yEnd: number;
  direction: "left" | "right" | "up" | "down";
  rotation: number;
  startOffset: number;
}) => {
  translateX.value = withRepeat(
    withDelay(
      startOffset,
      withSequence(
        withTiming(xEnd, {
          duration: 1000,
        }),
        withDelay(3000 - startOffset, withTiming(100, { duration: 0 }))
      )
    ),
    -1
  );

  translateY.value = withRepeat(
    withDelay(
      startOffset + animationLoopDuration * 0.3,
      withSequence(
        withTiming(yEnd, {
          duration: 1500,
        }),
        withDelay(3000 - startOffset, withTiming(yStart, { duration: 0 }))
      )
    ),
    -1
  );
};
