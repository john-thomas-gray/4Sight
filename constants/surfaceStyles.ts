import { StyleSheet } from "react-native";

export const surfaceStyles = StyleSheet.create({
  title: {
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  label: {
    textShadowColor: "rgba(0, 0, 0, 0.12)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  raised: {
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.18)",
  },
  board: {
    boxShadow: "0 6px 14px rgba(0, 0, 0, 0.24)",
  },
  floating: {
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.26)",
  },
  inset: {
    boxShadow:
      "inset 0 2px 4px rgba(0, 0, 0, 0.16), inset 0 -1px 0 rgba(255, 255, 255, 0.1)",
  },
});
