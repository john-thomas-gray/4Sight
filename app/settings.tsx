import { CLASSIC, SCHOOLHOUSE } from "@/constants/colorThemes";
import { useMegaContext } from "@/context/MegaContext";
import React from "react";
import { Pressable, Text, View } from "react-native";

const Settings = () => {
  const { settings } = useMegaContext();

  return (
    <View>
      <Text>Settings</Text>
      <Text> </Text>
      <Text>Themes</Text>
      <Pressable onPress={() => settings.setColorTheme(CLASSIC)}>
        <Text>Classic</Text>
      </Pressable>
      <Pressable onPress={() => settings.setColorTheme(SCHOOLHOUSE)}>
        <Text>Schoolhouse</Text>
      </Pressable>
    </View>
  );
};

export default Settings;
