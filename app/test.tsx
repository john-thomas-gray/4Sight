import Piece from "@/components/Piece";
import SlotSpace from "@/components/SlotSpace";
import React, { useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";

const Test = () => {
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const positionC = useRef(new Animated.ValueXY({ x: 30, y: 30 })).current;
  const [atB, setAtB] = useState(false);

  const animateToA = () => {
    Animated.timing(position, {
      toValue: { x: 0, y: 0 },
      duration: 500,
      useNativeDriver: true,
    }).start();
  };
  const animateToB = () => {
    Animated.sequence([
      Animated.spring(position, {
        toValue: { x: 100, y: 200 },
        useNativeDriver: true,
      }),
      Animated.delay(100), // Optional delay before next move
      Animated.timing(position, {
        toValue: { x: 30, y: 30 },
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const moveBox = () => {
    if (!atB) {
      animateToB();
      setAtB(true);
    } else {
      animateToA();
      setAtB(false);
    }
  };

  return (
    <View className="flex-1 flex-row items-center justify-center mt-90 bg-[#065f46]">
      <Piece
        team="white"
        currentWellId="test-id"
        initialPosition={{ x: 0, y: 0 }}
        slots={[]}
        wellSpaces={[]}
      />
      <SlotSpace id="test" orientation="N" register={() => {}} />
      <Animated.View
        style={[styles.box, { transform: position.getTranslateTransform() }]}
      />

      <Pressable style={styles.button} onPress={() => moveBox()}></Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 20,
    height: 20,
    backgroundColor: "red",
  },
  box: {
    width: 10,
    height: 10,
    backgroundColor: "black",
  },
});

export default Test;
