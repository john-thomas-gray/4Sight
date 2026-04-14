import { useLoadingTextAnimations } from "@/animations/loadingAnimations";
import { useSettings } from "@/context/SettingsContext";
import { Team } from "@/engine";
import React from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import PieceLoading from "./PieceLoading";

type LoadingScreenProps = { visible: boolean };

const LoadingContent = () => {
  const { theme } = useSettings();
  const translateX = useSharedValue(0);
  const fontSize = useSharedValue(76);
  useLoadingTextAnimations({ translateX, fontSize });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    fontSize: fontSize.value,
  }));

  return (
    <>
      <Animated.Text
        style={[
          animatedStyle,
          {
            marginTop: 12,
            color: theme.colorTheme.ODD_SPACE_COLOR,
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
          team={Team.One}
          xStart={100}
          yStart={0}
          xEnd={-43}
          arrivalOffsetFraction={0}
          offDirection="up"
          offDistance={700}
          offDurationFraction={0.15}
          rotateDirection="cw"
          rotationDegreesPerLoop={900}
        />
        <PieceLoading
          team={Team.Two}
          xStart={100}
          yStart={0}
          xEnd={-15}
          arrivalOffsetFraction={0.05}
          offDirection="down"
          offDistance={700}
          offDurationFraction={0.15}
          rotateDirection="ccw"
          rotationDegreesPerLoop={900}
        />
        <PieceLoading
          team={Team.One}
          xStart={100}
          yStart={0}
          xEnd={13}
          arrivalOffsetFraction={0.1}
          offDirection="right"
          offDistance={700}
          offDurationFraction={0.15}
          rotateDirection="cw"
          rotationDegreesPerLoop={900}
        />
      </View>
    </>
  );
};

const LoadingScreen = ({ visible }: LoadingScreenProps) => {
  const { theme } = useSettings();
  const overlayOpacity = useSharedValue(1);

  React.useEffect(() => {
    overlayOpacity.value = withTiming(visible ? 1 : 0, { duration: 350 });
  }, [visible, overlayOpacity]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
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
          bottom: 0,
          backgroundColor: theme.colorTheme.FELT_TOP,
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          flexDirection: "row",
        },
      ]}
    >
      {visible ? <LoadingContent /> : null}
    </Animated.View>
  );
};

export default LoadingScreen;
