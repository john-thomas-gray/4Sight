import { HighlightProps } from "@/types/board";
import React from "react";
import { StyleSheet, View } from "react-native";

const Highlight = ({ status }: { status: HighlightProps }) => {
  return (
    <View
      style={{
        height: 40,
        width: 40,
        borderRadius: 30,
        backgroundColor: "rgba(255, 217, 0, 0.15)",
        position: "absolute",
        // iOS
        shadowColor: "rgba(255, 217, 0)",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
        // Android
        elevation: 10,
      }}
    />
  );
};

export default Highlight;

const styles = StyleSheet.create({
  off: {
    height: 60,
    width: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 217, 0, 0.1)",
    position: "absolute",
    // iOS shadow
    shadowColor: "rgba(255, 217, 0, 0.9)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
    // Android elevation
    elevation: 10,
  },
  almost: {
    height: 60,
    width: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 217, 0, 0.1)",
    position: "absolute",
    // iOS shadow
    shadowColor: "rgba(255, 217, 0, 0.9)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
    // Android elevation
    elevation: 10,
  },
  winner: {
    height: 60,
    width: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 217, 0, 0.1)",
    position: "absolute",
    // iOS shadow
    shadowColor: "rgba(255, 217, 0, 0.9)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
    // Android elevation
    elevation: 10,
  },
});
