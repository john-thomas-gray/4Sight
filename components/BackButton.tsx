import backArrow from "@/assets/images/backArrow.png";
import { surfaceStyles } from "@/constants/surfaceStyles";
import { useDebouncedPress } from "@/hooks/useDebouncedPress";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ImageStyle,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";
import SurfaceGradient from "./SurfaceGradient";

type BackButtonProps = {
  variant?: "floating" | "inline";
  style?: ViewStyle;
  textStyle?: TextStyle;
  imageStyle?: ImageStyle;
};

const BackButton = ({
  variant = "floating",
  style,
  textStyle,
  imageStyle,
}: BackButtonProps) => {
  const router = useRouter();
  const onPress = useDebouncedPress(() => {
    router.replace("/");
  });

  return (
    <Pressable
      onPress={onPress}
      accessible
      accessibilityRole="button"
      style={[
        styles.button,
        surfaceStyles.raised,
        variant === "floating" && styles.floating,
        style,
      ]}
    >
      <SurfaceGradient variant="raised" borderRadius={3} />
      <Image
        source={backArrow}
        style={[styles.arrow, imageStyle]}
        accessible
        accessibilityRole="image"
      />
      <Text
        style={[styles.text, surfaceStyles.label, textStyle]}
        accessible
        accessibilityRole="text"
      >
        Back
      </Text>
    </Pressable>
  );
};

export default BackButton;

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 4,
    padding: 8,
  },
  floating: {
    borderWidth: 2,
    width: 96,
    position: "absolute",
    margin: 24,
    zIndex: 50,
  },
  arrow: {
    height: 24,
    width: 24,
  },
  text: {
    color: "#000000",
    fontSize: 18,
    lineHeight: 28,
  },
});
