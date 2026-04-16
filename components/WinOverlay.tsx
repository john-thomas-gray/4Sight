import { useSettings } from "@/context/SettingsContext";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

type WinOverlayProps = {
  visible: boolean;
  winner: string;
  onClose?: () => void;
};

const WinOverlay: React.FC<WinOverlayProps> = ({
  visible,
  winner,
  onClose,
}) => {
  const { theme } = useSettings();
  const opacity = useSharedValue(0);
  const [isOverlayVisible, setIsOverlayVisible] = useState(visible);

  const handleClose = useCallback(() => {
    setIsOverlayVisible(false);
    onClose?.();
  }, [onClose]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  useEffect(() => {
    const FADE_DURATION_MS = 400;
    const DISPLAY_DURATION_MS = 2200;
    let displayTimer: ReturnType<typeof setTimeout> | undefined;

    if (visible) {
      setIsOverlayVisible(true);
      opacity.value = withTiming(1, { duration: FADE_DURATION_MS });
      displayTimer = setTimeout(() => {
        opacity.value = withTiming(
          0,
          { duration: FADE_DURATION_MS },
          (finished) => {
            if (finished) scheduleOnRN(handleClose);
          }
        );
      }, DISPLAY_DURATION_MS);
    } else if (isOverlayVisible) {
      opacity.value = withTiming(
        0,
        { duration: FADE_DURATION_MS },
        (finished) => {
          if (finished) scheduleOnRN(handleClose);
        }
      );
    }

    return () => {
      if (displayTimer) clearTimeout(displayTimer);
    };
  }, [visible, isOverlayVisible, opacity, handleClose]);

  const { backgroundColor, textColor, displayText } = useMemo(() => {
    const t1Name = theme.textAndFontTheme.teamOneName;
    const t2Name = theme.textAndFontTheme.teamTwoName;
    const t1Color = theme.colorTheme.TEAM_ONE_COLOR;
    const t2Color = theme.colorTheme.TEAM_TWO_COLOR;

    if (winner === "teamOne") {
      return {
        backgroundColor: t1Color,
        textColor: t2Color,
        displayText: `${t1Name} Wins!`,
      };
    }
    if (winner === "teamTwo") {
      return {
        backgroundColor: t2Color,
        textColor: t1Color,
        displayText: `${t2Name} Wins!`,
      };
    }
    if (winner === "tie") {
      return {
        backgroundColor: "#FFA500",
        textColor: "#000000",
        displayText: "It's a Tie!",
      };
    }
    return {
      backgroundColor: "#FFA500",
      textColor: "#000000",
      displayText: "It's a Tie!",
    };
  }, [winner, theme]);

  if (!isOverlayVisible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, animatedStyle, { backgroundColor }]}
    >
      <Text style={[styles.text, { color: textColor }]}>{displayText}</Text>
    </Animated.View>
  );
};

export default WinOverlay;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
    paddingHorizontal: 24,
  },
  text: {
    fontSize: 64,
    fontWeight: "bold",
    textAlign: "center",
  },
});
