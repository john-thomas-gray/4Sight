import { useGameContext } from "@/context/GameContext";
import { Team } from "@/types/board";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const WinOverlay = ({
  onOpen,
  onClose,
  visible,
  winner,
}: {
  onOpen?: () => void;
  onClose?: () => void;
  visible: boolean;
  winner: Team;
}) => {
  const { settings } = useGameContext();

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
      onOpen?.();
      opacity.value = withTiming(1, { duration: FADE_DURATION_MS });
      displayTimer = setTimeout(() => {
        opacity.value = withTiming(
          0,
          { duration: FADE_DURATION_MS },
          (finished) => {
            if (finished) {
              scheduleOnRN(handleClose);
            }
          }
        );
      }, DISPLAY_DURATION_MS);
    } else if (isOverlayVisible) {
      opacity.value = withTiming(
        0,
        { duration: FADE_DURATION_MS },
        (finished) => {
          if (finished) {
            scheduleOnRN(handleClose);
          }
        }
      );
    }

    return () => {
      if (displayTimer) {
        clearTimeout(displayTimer);
      }
    };
  }, [visible, isOverlayVisible, opacity, onOpen, handleClose]);

  const { backgroundColor, textColor, displayText } = useMemo(() => {
    const teamOneName =
      settings.theme?.textAndFontTheme?.teamOneName || "Team One";
    const teamTwoName =
      settings.theme?.textAndFontTheme?.teamTwoName || "Team Two";
    const teamOneColor =
      settings.theme?.colorTheme?.TEAM_ONE_COLOR || "#ffffff";
    const teamTwoColor =
      settings.theme?.colorTheme?.TEAM_TWO_COLOR || "#000000";

    if (winner === Team.TeamOne) {
      return {
        backgroundColor: teamOneColor,
        textColor: teamTwoColor,
        displayText: `${teamOneName} Wins!`,
      };
    }

    if (winner === Team.TeamTwo) {
      return {
        backgroundColor: teamTwoColor,
        textColor: teamOneColor,
        displayText: `${teamTwoName} Wins!`,
      };
    }

    return {
      backgroundColor: "#FFA500",
      textColor: "#000000",
      displayText: "It's a Tie!",
    };
  }, [settings.theme?.textAndFontTheme, settings.theme?.colorTheme, winner]);

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
