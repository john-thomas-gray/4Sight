import { usePieceLoadingAnimation } from "@/animations/loadingAnimations";
import { GameElements } from "@/constants";
import { useGameContext } from "@/context/GameContext";
import { Team } from "@/types/board";
import React, { memo } from "react";
import { ViewStyle } from "react-native";
import Animated, {
  useAnimatedReaction,
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
  arrivalOffsetFraction?: number;
  offDirection?: "left" | "right" | "up" | "down";
  offDistance?: number;
  offDurationFraction?: number;
  rotateDirection?: "cw" | "ccw";
  rotationDegreesPerLoop?: number;
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
  arrivalOffsetFraction = 0,
  offDirection = "down",
  offDistance = 700,
  offDurationFraction = 0.15,
  rotateDirection = "cw",
  rotationDegreesPerLoop = 720,
}: PieceLoadingProps) => {
  const { settings } = useGameContext();

  const translateX = useSharedValue(xStart);
  const translateY = useSharedValue(yStart);
  const rotationSV = useSharedValue(0);
  const colorPhase = useSharedValue(0);

  usePieceLoadingAnimation({
    translateX,
    translateY,
    xStart,
    yStart,
    xEnd,
    yEnd,
    direction,
    rotation: rotationSV,
    startOffset: durationOffset,
    arrivalOffsetFraction,
    offDirection,
    offDistance,
    offDurationFraction,
    rotateDirection,
    rotationDegreesPerLoop,
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotationSV.value}deg` },
    ],
    backgroundColor:
      colorPhase.value % 2 === 0
        ? team === Team.TeamOne
          ? settings.theme?.colorTheme?.TEAM_ONE_COLOR || "#ffffff"
          : settings.theme?.colorTheme?.TEAM_TWO_COLOR || "#000000"
        : team === Team.TeamOne
        ? settings.theme?.colorTheme?.TEAM_TWO_COLOR || "#000000"
        : settings.theme?.colorTheme?.TEAM_ONE_COLOR || "#ffffff",
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
        ? settings.theme?.colorTheme?.TEAM_ONE_COLOR || "#ffffff"
        : settings.theme?.colorTheme?.TEAM_TWO_COLOR || "#000000",
  };

  useAnimatedReaction(
    () => rotationSV.value,
    (cur, prev) => {
      if (prev == null) return;
      if (Math.abs(cur) < Math.abs(prev)) {
        colorPhase.value = colorPhase.value === 0 ? 1 : 0;
      }
    }
  );

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Animated.View
        style={{
          position: "absolute",
          top: (GameElements.PIECE_SIZE / 1.4) * 0.2,
          right: (GameElements.PIECE_SIZE / 1.4) * 0.1,
          width: (GameElements.PIECE_SIZE / 1.4) * 0.4,
          height: (GameElements.PIECE_SIZE / 1.4) * 0.2,
          borderRadius: GameElements.PIECE_RADIUS / 1.4,
          backgroundColor: "rgba(200, 200, 200, 0.6)",
          transform: [{ rotate: "40deg" }],
          zIndex: 1,
        }}
      />
    </Animated.View>
  );
};

export default memo(PieceLoading);
