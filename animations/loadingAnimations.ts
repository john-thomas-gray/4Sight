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
        withTiming(-45, {
          duration: animationLoopDuration * 0.5,
        }),
        withTiming(0, { duration: animationLoopDuration * 0.2 })
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
  const eventOffset = animationLoopDuration * 0.7;
  const upDuration = animationLoopDuration * 0.05;
  const downDuration = animationLoopDuration * 0.05;
  const remainderHold =
    animationLoopDuration - (eventOffset + upDuration + downDuration);

  fontSize.value = withRepeat(
    withSequence(
      withDelay(
        eventOffset,
        withSequence(
          withTiming(80, { duration: upDuration }),
          withTiming(76, { duration: downDuration })
        )
      ),
      withTiming(76, { duration: remainderHold })
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
  const D = animationLoopDuration;

  // X: arrive at the same moment the text first reaches -45 (0.2D delay + 0.1D ramp => 0.3D)
  const arriveDelay = D * 0.2;
  const arriveDuration = D * 0.1;
  const holdAfterArriveX = D - (arriveDelay + arriveDuration);

  translateX.value = withRepeat(
    withSequence(
      withDelay(arriveDelay, withTiming(xEnd, { duration: arriveDuration })),
      withTiming(xEnd, { duration: holdAfterArriveX }),
      withTiming(xStart, { duration: 0 })
    ),
    -1
  );

  // Y: shoot downward when font size reaches 80 (0.7D start + 0.05D up => 0.75D)
  const downStart = D * 0.75;
  const downDuration = D * 0.15; // fast shoot
  const holdAfterDownY = D - (downStart + downDuration);

  translateY.value = withRepeat(
    withSequence(
      withDelay(downStart, withTiming(yEnd, { duration: downDuration })),
      withTiming(yEnd, { duration: holdAfterDownY }),
      withTiming(yStart, { duration: 0 })
    ),
    -1
  );
};
