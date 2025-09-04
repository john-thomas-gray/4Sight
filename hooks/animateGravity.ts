import { Animations, GameElements } from "@/constants";
import { Layout } from "@/context/GameContext";
import { Easing } from "react-native";
import { SharedValue, withTiming } from "react-native-reanimated";

const animateGravity = ({
  pieceId,
  translateX,
  translateY,
  layout,
}: {
  pieceId: string;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  layout: Layout;
}) => {
  "worklet";
  const entry = Object.entries(layout.boardPieceLocations).find(
    ([, value]) => value === pieceId
  );
  if (entry) {
    console.log("gravity works");
    const [spaceId, pieceId] = entry;
    const piece = layout.pieces[pieceId];

    const spaceLayout = layout.spaces[spaceId];
    translateX.value = withTiming(
      spaceLayout.pageX + spaceLayout.width / 2 - GameElements.PIECE_RADIUS,
      {
        duration: Animations.SLOT_TO_SPACE_DURATION,
        easing: Easing.bounce,
      }
    );
    translateY.value = withTiming(
      spaceLayout.pageY + spaceLayout.height / 2 - GameElements.PIECE_RADIUS,
      {
        duration: Animations.SLOT_TO_SPACE_DURATION,
        easing: Easing.bounce,
      }
    );
  } else {
    console.log("gravity sucks");
    return;
  }
};
export default animateGravity;
