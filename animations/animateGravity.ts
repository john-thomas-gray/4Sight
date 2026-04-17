import { GameElements } from "@/constants";
import { SLOT_TO_SPACE } from "@/types/animation";
import { CellLayout } from "@/types/board";
import { Easing, SharedValue, withTiming } from "react-native-reanimated";

const animateGravity = ({
  translateX,
  translateY,
  spaceLayout,
}: {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  spaceLayout: CellLayout;
}) => {
  "worklet";
  if (!spaceLayout) {
    return;
  }
  translateX.value = withTiming(
    spaceLayout.pageX + spaceLayout.width / 2 - GameElements.PIECE_RADIUS,
    {
      duration: SLOT_TO_SPACE,
      easing: Easing.bounce,
    },
  );
  translateY.value = withTiming(
    spaceLayout.pageY + spaceLayout.height / 2 - GameElements.PIECE_RADIUS,
    {
      duration: SLOT_TO_SPACE,
      easing: Easing.bounce,
    },
  );
};
export default animateGravity;
