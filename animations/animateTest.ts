import { Easing, SharedValue, withTiming } from "react-native-reanimated";

const animateTest = ({
  tX,
  tY,
}: {
  tX: SharedValue<number>;
  tY: SharedValue<number>;
}) => {
  "worklet";
  tX.value = withTiming(100, {
    duration: 500,
    easing: Easing.inOut(Easing.quad),
  });
  tY.value = withTiming(100, {
    duration: 500,
    easing: Easing.inOut(Easing.quad),
  });
  console.log("bongus");
};

export default animateTest;
