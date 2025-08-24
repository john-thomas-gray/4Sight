import { useGameContext } from "@/context/GameContext";
import React from "react";
import { Pressable, Text, View } from "react-native";

const Settings = () => {
  const { settings } = useGameContext();

  const setTheme = (theme: string) => {
    settings.setColorTheme(theme.toUpperCase);
  };

  return (
    <View>
      <Text>Settings</Text>
      <Text> </Text>
      <Text>Themes</Text>
      <Pressable onPress={() => settings.setColorTheme("CLASSIC")}>
        Classic
      </Pressable>
      <Pressable onPress={() => settings.setColorTheme("SCHOOLHOUSE")}>
        Schoolhouse
      </Pressable>
    </View>
  );
};

export default Settings;
