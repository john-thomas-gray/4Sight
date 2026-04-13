import React from "react";
import { Button, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export default function TestGround() {
  // Shared value for rotation
  const rotation = useSharedValue(0);

  // Animated style
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` }, // rotation in degrees
      ],
    };
  });

  const rotateBox = () => {
    // Rotate 180 degrees if at 0, else rotate back to 0
    rotation.value = withTiming(rotation.value === 0 ? 180 : 0, {
      duration: 500, // animation duration in ms
    });
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.box, animatedStyle]} />
      <Button title="Rotate" onPress={rotateBox} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    width: 100,
    height: 100,
    backgroundColor: "tomato",
  },
});
