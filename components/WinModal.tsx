import { useGameContext } from "@/context/GameContext";
import { Team } from "@/types/board";
import { GameState } from "@/types/logic";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const WinModal = ({
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
  const { settings, logic } = useGameContext();

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    let timer: number | undefined;
    if (visible) {
      // Visible immediately; scale up in 1s, hold 2s, shrink to 0 in 1s
      opacity.value = 1;
      scale.value = withSequence(
        withTiming(1, { duration: 1000 }),
        withDelay(2000, withTiming(0, { duration: 1000 }))
      );
      timer = setTimeout(() => {
        setGameState(GameState.PostGame);
      }, 4000);
    } else {
      // Reset values when not visible
      scale.value = 0;
      opacity.value = 0;
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [visible, scale, opacity, logic]);

  if (!visible) return null;

  let displayText = "";
  let textColor = "#444";

  if (winner === Team.TeamOne) {
    displayText = `${
      settings.theme?.textAndFontTheme?.teamOneName || "Team One"
    } Wins!`;
    textColor = settings.theme?.colorTheme?.TEAM_ONE_COLOR || "#ffffff";
  } else if (winner === Team.TeamTwo) {
    displayText = `${
      settings.theme?.textAndFontTheme?.teamTwoName || "Team Two"
    } Wins!`;
    textColor = settings.theme?.colorTheme?.TEAM_TWO_COLOR || "#000000";
  } else if (winner === Team.Both) {
    displayText = "It's a Tie!";
    textColor = "#FFA500"; // Orange for tie
  }
  return (
    <View style={styles.overlay}>
      <Animated.View style={animatedStyle}>
        <Text style={[styles.text, { color: textColor }]}>{displayText}</Text>
      </Animated.View>
    </View>
  );
};

export default WinModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
  },
  text: {
    fontSize: 64,
    fontWeight: "bold",
    textAlign: "center",
  },
});
