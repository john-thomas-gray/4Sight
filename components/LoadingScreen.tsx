import { useLoadingTextAnimations } from "@/animations/loadingAnimations";
import { useGameContext } from "@/context/GameContext";
import { Team } from "@/types/board";
import React from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import PieceLoading from "./PieceLoading";

const LoadingScreen = () => {
  const { settings } = useGameContext();
  const [xStart, yStart] = [0, 0];
  const [translateX, translateY] = [
    useSharedValue(xStart),
    useSharedValue(yStart),
  ];
  const fontSize = useSharedValue(76);
  useLoadingTextAnimations({ translateX, translateY, fontSize });
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    fontSize: fontSize.value,
  }));
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 90,
        backgroundColor: settings.theme?.colorTheme?.FELT_TOP || "#222",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        flexDirection: "row",
      }}
    >
      <Animated.Text
        style={[
          animatedStyle,
          {
            marginTop: 12,
            color: settings.theme?.colorTheme?.ODD_SPACE_COLOR || "#ffffff",
            fontWeight: "bold",
          },
        ]}
      >
        Loading
      </Animated.Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          height: 100,
        }}
      >
        <PieceLoading
          team={Team.TeamOne}
          xStart={100}
          yStart={0}
          xEnd={-43}
          yEnd={500}
          durationOffset={0}
        />
        {/* <PieceLoading
          team={Team.TeamTwo}
          xStart={100}
          yStart={0}
          xEnd={-15}
          yEnd={-500}
          durationOffset={500}
        />
        <PieceLoading
          team={Team.TeamOne}
          xStart={100}
          yStart={0}
          xEnd={13}
          yEnd={0}
          durationOffset={1000} */}
        {/* /> */}
      </View>
    </View>
  );
};
export default LoadingScreen;
