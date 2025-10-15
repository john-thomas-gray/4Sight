import { useLoadingTextAnimations } from "@/animations/loadingAnimations";
import { useGameContext } from "@/context/GameContext";
import { Team } from "@/types/board";
import React from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import PieceLoading from "./PieceLoading";

type LoadingScreenProps = { visible: boolean };
const LoadingScreen = ({ visible }: LoadingScreenProps) => {
  const { settings } = useGameContext();
  const [xStart, yStart] = [0, 0];
  const [translateX, translateY] = [
    useSharedValue(xStart),
    useSharedValue(yStart),
  ];
  const fontSize = useSharedValue(76);
  useLoadingTextAnimations({ translateX, translateY, fontSize });
  const overlayOpacity = useSharedValue(1);

  React.useEffect(() => {
    overlayOpacity.value = withTiming(visible ? 1 : 0, { duration: 400 });
  }, [visible, overlayOpacity]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    fontSize: fontSize.value,
  }));
  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        overlayStyle,
        {
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
        },
      ]}
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
        {/* Left piece (staggered earlier) */}
        <PieceLoading
          team={Team.TeamOne}
          xStart={100}
          yStart={0}
          xEnd={-43}
          yEnd={500}
          durationOffset={0}
          arrivalOffsetFraction={0}
          offDirection="up"
          offDistance={700}
          offDurationFraction={0.15}
          rotateDirection="cw"
          rotationDegreesPerLoop={900}
        />

        {/* Middle piece (staggered mid) */}
        <PieceLoading
          team={Team.TeamTwo}
          xStart={100}
          yStart={0}
          xEnd={-15}
          yEnd={-500}
          durationOffset={0}
          arrivalOffsetFraction={0.05}
          offDirection="down"
          offDistance={700}
          offDurationFraction={0.15}
          rotateDirection="ccw"
          rotationDegreesPerLoop={900}
        />

        {/* Right piece (staggered later) */}
        <PieceLoading
          team={Team.TeamOne}
          xStart={100}
          yStart={0}
          xEnd={13}
          yEnd={0}
          durationOffset={0}
          arrivalOffsetFraction={0.1}
          offDirection="right"
          offDistance={700}
          offDurationFraction={0.15}
          rotateDirection="cw"
          rotationDegreesPerLoop={900}
        />
      </View>
    </Animated.View>
  );
};
export default LoadingScreen;
