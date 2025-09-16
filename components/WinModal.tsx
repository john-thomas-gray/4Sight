import { useGameContext } from "@/context/GameContext";
import { Team } from "@/types/board";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
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
  winner: Team
}) => {
  const {settings} = useGameContext()

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (visible) {
      // Start animation sequence when modal becomes visible
      scale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 100 }), // Bounce up
        withSpring(1, { damping: 10, stiffness: 120 }),  // Settle to normal size
        withDelay(2000, withSpring(0, { damping: 12, stiffness: 150 })) // Shrink after delay
      );

      opacity.value = withSequence(
        withSpring(1, { damping: 10, stiffness: 100 }),
        withDelay(2000, withSpring(0, { damping: 12, stiffness: 150 }))
      );
    } else {
      // Reset values when not visible
      scale.value = 0;
      opacity.value = 0;
    }
  }, [visible, scale, opacity]);

  if (!visible) return null;

  let displayText = "";
  let textColor = "#444"

  if (winner === Team.TeamOne) {
    displayText = "Team One Wins!";
    textColor = settings.colorTheme.TEAM_ONE_COLOR;
  } else if (winner === Team.TeamTwo) {
    displayText = "Team Two Wins!";
    textColor = settings.colorTheme.TEAM_TWO_COLOR;
  } else if (winner === Team.Both) {
    displayText = "Both Teams Win!";
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
    zIndex: 1000
  },
  text: {
    fontSize: 64,
    fontWeight: "bold",
    textAlign: "center",
  },
});
