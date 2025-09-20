import { GameElements } from "@/constants";
import { useGameContext } from "@/context/GameContext";
import { PieceProps } from "@/types/logic";
import React, { useMemo } from "react";
import { ViewStyle } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

const PiecePreview = ({ team, id }: PieceProps) => {
  const { layout, logic, settings } = useGameContext();

  const animate = useMemo(() => {
    return logic.pieceAnimations[id];
  }, [logic.pieceAnimations, id]);
  const status = useMemo(() => {
    return logic.pieceStatusMap[id];
  }, [logic.pieceStatusMap, id]);
  if (!animate) {
    throw new Error(`No animation found for piece id ${id}`);
  }

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [
      { translateX: animate.translateX.value },
      { translateY: animate.translateY.value },
      { scaleX: animate.scaleX.value },
      { scaleY: animate.scaleY.value },
      { skewX: `${animate.skewX.value}deg` },
      { skewY: `${animate.skewY.value}deg` },
      { rotate: `${animate.rotation.value}deg` },
    ],
    backgroundColor: animate.color.value,
    // shadows: [
    //   { shadowOpacity: shadowOpacity.value },
    //   { shadowRadius: shadowRadius },
    //   { shadowOffset: shadowOffset },
    // ],
  }));

  const baseStyle: ViewStyle = {
    height: GameElements.PIECE_SIZE,
    width: GameElements.PIECE_SIZE,
    borderRadius: GameElements.PIECE_RADIUS,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    zIndex: 500,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 0,
    left: 0,
    opacity: 0.5,
  };

  return <Animated.View style={[baseStyle, animatedStyles]} />;
};

export default PiecePreview;
