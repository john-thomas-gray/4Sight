import { images } from "@/assets/images";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, Text } from "react-native";

const BackButton = () => {
  const router = useRouter();

  return (
    <Pressable
      className="flex-row items-center justify-between border-2 border-black rounded p-2 w-24 absolute m-6 z-50"
      onPress={() => {
        router.replace("/");
      }}
      accessible
      accessibilityRole="button"
    >
      <Image
        source={images.backArrow}
        className="h-6 w-6"
        accessible
        accessibilityRole="image"
      />
      <Text className="text-black text-lg" accessible accessibilityRole="text">
        Back
      </Text>
    </Pressable>
  );
};

export default BackButton;
