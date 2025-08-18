import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const SwipeBlock = () => {
  const swipeDownGesture = Gesture.Pan().onEnd((event) => {
    if (event.translationY > 50) {
      console.log("hello");
    }
  });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={swipeDownGesture}>
        <View style={styles.block}>
          <Text style={styles.text}>Swipe Me ↓</Text>
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  block: {
    width: 100,
    height: 100,
    backgroundColor: "#065f46",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  text: {
    color: "white",
    fontWeight: "bold",
  },
});

export default SwipeBlock;
