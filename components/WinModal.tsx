import { useGameContext } from "@/context/GameContext";
import { Team } from "@/types/board";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

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
      <Text style={[styles.text, { color: textColor }]}>{displayText}</Text>
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
