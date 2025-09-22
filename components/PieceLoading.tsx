import { usePieceLoadingAnimation } from "@/animations/loadingAnimations";
import { GameElements } from "@/constants";
import { useGameContext } from "@/context/GameContext";
import { Team } from "@/types/board";
import React, { memo } from "react";
import { ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

type PieceLoadingProps = {
  team: Team;
  xStart: number;
  yStart: number;
  xEnd: number;
  yEnd: number;
  durationOffset: number;
  direction?: "left" | "right" | "up" | "down";
  rotation?: number;
  duration?: number;
};

const PieceLoading = ({
  team,
  xStart,
  yStart,
  xEnd,
  yEnd,
  durationOffset,
  direction = "right",
  rotation = 0,
  duration = 1000,
}: PieceLoadingProps) => {
  const { settings } = useGameContext();

  const translateX = useSharedValue(xStart);
  const translateY = useSharedValue(yStart);

  usePieceLoadingAnimation({
    translateX,
    translateY,
    direction,
    rotation,
    duration,
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const style: ViewStyle = {
    height: GameElements.PIECE_SIZE / 1.4,
    width: GameElements.PIECE_SIZE / 1.4,
    borderRadius: GameElements.PIECE_RADIUS / 1.4,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    zIndex: 500,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 10,
    left: 0,
    backgroundColor:
      team === Team.TeamOne
        ? settings.colorTheme.TEAM_ONE_COLOR
        : settings.colorTheme.TEAM_TWO_COLOR,
  };

  return <Animated.View style={[style, animatedStyle]} />;
};

export default memo(PieceLoading);
