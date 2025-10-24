import { images } from "@/assets/images";
import { useDebouncedPress } from "@/hooks/useDebouncedPress";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ImageStyle,
  Pressable,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";

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
      className={
        variant === "floating"
          ? "flex-row items-center justify-between border-2 border-black rounded p-2 w-24 absolute m-6 z-50"
          : "flex-row items-center justify-between border rounded p-2"
      }
      onPress={onPress}
      accessible
      accessibilityRole="button"
      style={style}
    >
      <Image
        source={images.backArrow}
        className="h-6 w-6"
        style={imageStyle}
        accessible
        accessibilityRole="image"
      />
      <Text
        className={variant === "floating" ? "text-black text-lg" : "text-lg"}
        style={textStyle}
        accessible
        accessibilityRole="text"
      >
        Back
      </Text>
    </Pressable>
  );
};

export default BackButton;
