import React from "react";
import {
  cancelAnimation,
  Easing,
  SharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export const loopDuration = 4000;
const D = loopDuration;

type LoadingTextAnimation = {
  translateX: SharedValue<number>;
  fontSize: SharedValue<number>;
};

export const useLoadingMoveTextAnimation = ({
  translateX,
}: LoadingTextAnimation) => {
  React.useEffect(() => {
    translateX.value = withRepeat(
      withDelay(
        D * 0.2,
        withSequence(
          withTiming(-45, { duration: D * 0.1 }),
          withTiming(-45, { duration: D * 0.5 }),
          withTiming(0, { duration: D * 0.2 }),
        ),
      ),
      -1,
    );
    return () => {
      cancelAnimation(translateX);
    };
  }, [translateX]);
};

export const useLoadingFontSizeAnimation = ({
  fontSize,
}: {
  fontSize: SharedValue<number>;
}) => {
  const eventOffset = D * 0.7;
  const upDuration = D * 0.05;
  const downDuration = D * 0.05;
  const remainderHold = D - (eventOffset + upDuration + downDuration);

  React.useEffect(() => {
    fontSize.value = withRepeat(
      withSequence(
        withDelay(
          eventOffset,
          withSequence(
            withTiming(80, { duration: upDuration }),
            withTiming(76, { duration: downDuration }),
          ),
        ),
        withTiming(76, { duration: remainderHold }),
      ),
      -1,
    );
    return () => {
      cancelAnimation(fontSize);
    };
  }, [fontSize, eventOffset, upDuration, downDuration, remainderHold]);
};

export const useLoadingTextAnimations = ({
  translateX,
  fontSize,
}: LoadingTextAnimation) => {
  useLoadingMoveTextAnimation({ translateX, fontSize });
  useLoadingFontSizeAnimation({ fontSize });
};

export const usePieceLoadingAnimation = ({
  translateX,
  translateY,
  xStart,
  yStart,
  xEnd,
  rotation,
  arrivalOffsetFraction = 0,
  offDirection = "down",
  offDistance = 700,
  offDurationFraction = 0.15,
  rotateDirection = "cw",
  rotationDegreesPerLoop = 720,
}: {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  xStart: number;
  yStart: number;
  xEnd: number;
  rotation: SharedValue<number>;
  arrivalOffsetFraction?: number;
  offDirection?: "left" | "right" | "up" | "down";
  offDistance?: number;
  offDurationFraction?: number;
  rotateDirection?: "cw" | "ccw";
  rotationDegreesPerLoop?: number;
}) => {
  const degrees =
    rotateDirection === "ccw"
      ? -rotationDegreesPerLoop
      : rotationDegreesPerLoop;
  React.useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(degrees, { duration: D, easing: Easing.linear }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
    );
    return () => {
      cancelAnimation(rotation);
    };
  }, [rotation, degrees]);

  const arriveDelay = D * (0.2 + arrivalOffsetFraction);
  const arriveDuration = D * 0.1;
  const offStart = D * 0.7;
  const offDuration = D * offDurationFraction;
  const holdUntilOff = Math.max(offStart - (arriveDelay + arriveDuration), 0);
  const offTargetX =
    offDirection === "right"
      ? xEnd + offDistance
      : offDirection === "left"
        ? xEnd - offDistance
        : xEnd;
  const offTargetY =
    offDirection === "down"
      ? yStart + offDistance
      : offDirection === "up"
        ? yStart - offDistance
        : yStart;
  const postOffHoldX =
    offDirection === "left" || offDirection === "right"
      ? Math.max(
          D - (arriveDelay + arriveDuration + holdUntilOff + offDuration),
          0,
        )
      : Math.max(D - (arriveDelay + arriveDuration + holdUntilOff), 0);
  React.useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withDelay(arriveDelay, withTiming(xEnd, { duration: arriveDuration })),
        withTiming(xEnd, { duration: holdUntilOff }),
        ...(offDirection === "left" || offDirection === "right"
          ? [withTiming(offTargetX, { duration: offDuration })]
          : []),
        withTiming(
          offDirection === "left" || offDirection === "right"
            ? offTargetX
            : xEnd,
          { duration: postOffHoldX },
        ),
        withTiming(xStart, { duration: 0 }),
      ),
      -1,
    );

    const postOffHoldY =
      offDirection === "up" || offDirection === "down"
        ? Math.max(D - (offStart + offDuration), 0)
        : D;
    translateY.value = withRepeat(
      withSequence(
        ...(offDirection === "up" || offDirection === "down"
          ? [
              withDelay(
                offStart,
                withTiming(offTargetY, { duration: offDuration }),
              ),
              withTiming(offTargetY, { duration: postOffHoldY }),
            ]
          : [withTiming(yStart, { duration: D })]),
        withTiming(yStart, { duration: 0 }),
      ),
      -1,
    );

    return () => {
      cancelAnimation(translateX);
      cancelAnimation(translateY);
    };
  }, [
    translateX,
    translateY,
    arriveDelay,
    arriveDuration,
    holdUntilOff,
    offDirection,
    offTargetX,
    offDuration,
    postOffHoldX,
    xStart,
    xEnd,
    offStart,
    offTargetY,
    yStart,
  ]);
};
