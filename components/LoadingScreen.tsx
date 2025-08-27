import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const LoadingScreen = () => {
  {
    /* Piece dropping anim. */
  }
  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color="#fff" />
      <Text style={styles.loadingText}>Loading game board…</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  loadingText: {
    marginTop: 12,
    color: "#fff",
    fontSize: 16,
  },
});

export default LoadingScreen;
