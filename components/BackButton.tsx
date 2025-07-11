import { images } from "@/constants";
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
        console.log("pressed");
      }}
    >
      <Image source={images.backArrow} className="h-6 w-6" />
      <Text className="text-black text-lg">Back</Text>
    </Pressable>
  );
};

export default BackButton;
