import animateTest from "@/animations/animateTest";
import { GameElements } from "@/constants";
import { useGameContext } from "@/context/GameContext";
import { Team } from "@/types/board";
import React from "react";
import { Pressable, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  scheduleOnRN,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const AnimTest = ({ team }: { team: Team }) => {
  const { settings } = useGameContext();
  const translateX = useSharedValue(25);
  const translateY = useSharedValue(25);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
      // backgroundColor: isHeld.value ? "red" : team,
    };
  });
  const baseStyle: ViewStyle = {
    height: GameElements.PIECE_SIZE,
    width: GameElements.PIECE_SIZE,
    borderRadius: GameElements.PIECE_RADIUS,
    backgroundColor:
      team === Team.TeamOne
        ? settings.colorTheme.TEAM_ONE_COLOR
        : settings.colorTheme.TEAM_TWO_COLOR,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    zIndex: 1000,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 0,
    left: 0,
  };

  const move = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.absoluteX - GameElements.PIECE_RADIUS;
      translateY.value = event.absoluteY - GameElements.PIECE_RADIUS;
    })
    .onEnd(() => {
      console.log("bingus");
      animateTest({ tX: translateX, tY: translateY });
    });

  return (
    <>
      <Pressable
        onPress={() => {
          scheduleOnRN(animateTest)({ tX: translateX, tY: translateY });

          console.log("pressed");
        }}
        style={{ height: 40, width: 40, backgroundColor: "red" }}
      />
      <GestureDetector gesture={move}>
        <Animated.View style={[baseStyle, animatedStyles]}></Animated.View>
      </GestureDetector>
    </>
  );
};

export default AnimTest;
