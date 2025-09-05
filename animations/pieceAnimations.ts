import {
  Easing,
  SharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type AnimateWinner = {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  scaleX: SharedValue<number>;
  scaleY: SharedValue<number>;
  skewX?: SharedValue<string>;
  skewY?: SharedValue<string>;
  shadowOpacity?: SharedValue<number>;
  shadowRadius?: SharedValue<number>;
  shadowOffset?: SharedValue<number>;
};

export function animateWinner({
  translateX,
  translateY,
  scaleX,
  scaleY,
}: // skewX,
// skewY,
// shadowOpacity,
// shadowRadius,
// shadowOffset,
AnimateWinner) {
  const trans = {
    0: { x: translateX.value, y: translateY.value },
    1: { x: translateX.value - 5, y: translateY.value - 15 },
  };

  const scale = {
    0: { x: scaleX.value, y: scaleY.value },
    1: { x: scaleX.value * 1.3, y: scaleY.value * 1.3 },
  };
  type Point = { x: number; y: number };
  type Animation = {
    svx: SharedValue<number>;
    svy: SharedValue<number>;
    v0: Point;
    v1: Point;
  };

  const animation = ({ svx, svy, v0, v1 }: Animation) => {
    svx.value = withSequence(
      withTiming(v1.x, {
        duration: 1000,
        easing: Easing.inOut(Easing.exp),
      }),
      withDelay(
        300,
        withTiming(v0.x, {
          duration: 500,
          easing: Easing.bounce,
        })
      )
    );
    svy.value = withSequence(
      withTiming(v1.y, {
        duration: 1000,
        easing: Easing.inOut(Easing.exp),
      }),
      withDelay(
        300,
        withTiming(v0.x, {
          duration: 500,
          easing: Easing.bounce,
        })
      )
    );
  };

  animation({ svx: translateX, svy: translateY, v0: trans[0], v1: trans[1] });
  animation({ svx: scaleX, svy: scaleY, v0: scale[0], v1: scale[1] });
}
