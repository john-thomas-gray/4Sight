import { Animations, GameElements } from "@/constants";
import { Layout, Logic } from "@/context/GameContext";
import { Easing, SharedValue, withTiming } from "react-native-reanimated";

const animateGravity = ({
  pieceId,
  translateX,
  translateY,
  layout,
  logic,
}: {
  pieceId: string;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  layout: Layout;
  logic: Logic;
}) => {
  "worklet";
  const entry = Object.entries(layout.boardPieceLocations).find(
    ([, value]) => value === pieceId
  );
  if (entry) {
    const [spaceId, pieceId] = entry;
    const piece = logic.pieces[pieceId];

    const spacelayout = layout.spaces[spaceId];
    translateX.value = withTiming(
      spacelayout.pageX + spacelayout.width / 2 - GameElements.PIECE_RADIUS,
      {
        duration: Animations.SLOT_TO_SPACE_DURATION,
        easing: Easing.bounce,
      }
    );
    translateY.value = withTiming(
      spacelayout.pageY + spacelayout.height / 2 - GameElements.PIECE_RADIUS,
      {
        duration: Animations.SLOT_TO_SPACE_DURATION,
        easing: Easing.bounce,
      }
    );
  } else {
    return;
  }
};
export default animateGravity;
