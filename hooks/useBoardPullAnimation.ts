import { Animations, GameElements } from "@/constants";
import { useEffect } from "react";
import { Easing, withTiming } from "react-native-reanimated";

interface UsePiecePullAnimationProps {
  pieceIdIn: string;
  boardPieceLocations: Record<string, string>;
  spaces: Record<string, any>; // You can type this more strictly if needed
  translateX: any; // shared value
  translateY: any; // shared value
}

const useBoardPullAnimation = ({
  pieceIdIn,
  boardPieceLocations,
  spaces,
  translateX,
  translateY,
}: UsePiecePullAnimationProps) => {
  useEffect(() => {
    const nextSpaceId = Object.entries(boardPieceLocations).find(
      ([spaceId, pieceId]) => pieceId === pieceIdIn
    )?.[0];

    if (nextSpaceId && spaces[nextSpaceId]) {
      const nextSpaceLayout = spaces[nextSpaceId];
      translateX.value = withTiming(
        nextSpaceLayout.pageX +
          nextSpaceLayout.width / 2 -
          GameElements.PIECE_RADIUS,
        {
          duration: Animations.SLOT_TO_SPACE_DURATION,
          easing: Easing.bounce,
        }
      );
      translateY.value = withTiming(
        nextSpaceLayout.pageY +
          nextSpaceLayout.height / 2 -
          GameElements.PIECE_RADIUS,
        {
          duration: Animations.SLOT_TO_SPACE_DURATION,
          easing: Easing.bounce,
        }
      );
    }
  }, [boardPieceLocations, spaces]);
};
export default useBoardPullAnimation;
