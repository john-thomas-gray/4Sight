import { WINNER_V0, WINNER_V1 } from "@/constants/animations";
import {
  Easing,
  SharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type AnimateWinner = {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  scaleX: SharedValue<number>;
  scaleY: SharedValue<number>;
  skewX: SharedValue<number>;
  skewY: SharedValue<number>;
  rotation: SharedValue<number>;
  shadowOpacity?: SharedValue<number>;
  shadowRadius?: SharedValue<number>;
  shadowOffset?: SharedValue<number>;
  color: SharedValue<string>;
  winnerColor: SharedValue<string>;
};

export function animateWinner({
  translateX,
  translateY,
  scaleX,
  scaleY,
  skewX,
  skewY,
  rotation,
  color,
  winnerColor,
}: // shadowOpacity,
// shadowRadius,
// shadowOffset,
AnimateWinner) {
  "worklet";
  const trans = {
    0: { x: translateX.value, y: translateY.value },
    1: { x: translateX.value - 5, y: translateY.value - 15 },
  };

  const scale = {
    0: { x: scaleX.value, y: scaleY.value },
    1: { x: scaleX.value * 1.3, y: scaleY.value * 1.3 },
  };

  const skew = {
    0: { x: skewX.value, y: skewY.value },
    1: { x: "5deg", y: "15deg" },
  };
  const rot = {
    0: { x: rotation.value, y: "0" },
    1: { x: "deg", y: "0" },
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
        duration: WINNER_V1,
        easing: Easing.inOut(Easing.exp),
      }),

      withTiming(v0.x, {
        duration: WINNER_V0,
        easing: Easing.bounce,
      })
    );
    svy.value = withSequence(
      withTiming(v1.y, {
        duration: WINNER_V1,
        easing: Easing.inOut(Easing.exp),
      }),

      withTiming(v0.y, {
        duration: WINNER_V0,
        easing: Easing.bounce,
      })
    );
  };

  animation({ svx: translateX, svy: translateY, v0: trans[0], v1: trans[1] });
  animation({ svx: scaleX, svy: scaleY, v0: scale[0], v1: scale[1] });

  color.value = withTiming(winnerColor.value, {
    duration: WINNER_V1,
    easing: Easing.inOut(Easing.exp),
  });
  // type PointSkew = { x: string; y: string };
  // type AnimationSkew = {
  //   svx: SharedValue<string>;
  //   svy: SharedValue<string>;
  //   v0: PointSkew;
  //   v1: PointSkew;
  // };

  // const animationSkew = ({ svx, svy, v0, v1 }: AnimationSkew) => {
  //   svx.value = withSequence(

  //       withTiming(v1.x, {
  //         duration: WINNER_V1,
  //         easing: Easing.inOut(Easing.exp),
  //       }),

  //

  //       withTiming(v0.x, {
  //         duration: WINNER_V0,
  //         easing: Easing.bounce,
  //       })

  //   );
  //   svy.value = withSequence(

  //       withTiming(v1.y, {
  //         duration: WINNER_V1,
  //         easing: Easing.inOut(Easing.exp),
  //       }),

  //

  //       withTiming(v0.y, {
  //         duration: WINNER_V0,
  //         easing: Easing.bounce,
  //       })

  //   );
  // };



  // animationSkew({ svx: skewX, svy: skewY, v0: skew[0], v1: skew[1] });
}
