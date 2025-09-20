import { CLASSIC, SCHOOLHOUSE } from "@/constants/colorThemes";
import { useGameContext } from "@/context/GameContext";
import React from "react";
import { Pressable, Text, View } from "react-native";

const Settings = () => {
  const { settings } = useGameContext();
  const isSameTheme = (a: typeof CLASSIC, b: typeof CLASSIC) =>
    a.TEAM_ONE_COLOR === b.TEAM_ONE_COLOR &&
    a.TEAM_TWO_COLOR === b.TEAM_TWO_COLOR &&
    a.FELT_TOP === b.FELT_TOP;
  const isClassicSelected = isSameTheme(settings.colorTheme, CLASSIC);
  const isSchoolhouseSelected = isSameTheme(settings.colorTheme, SCHOOLHOUSE);

  return (
    <View className="flex-1 bg-white">
      <View className="pl-20 pr-20 pt-20 pb-8">
        <Text className="text-7xl font-bold text-gray-900">Settings</Text>
      </View>

      <View className="pl-20 pr-20">
        <Text className="text-5xl font-semibold text-gray-800 mb-3">
          Themes
        </Text>
        <View className="flex-row gap-4">
          <Pressable
            className={`w-1/4 self-left items-left justify-left rounded-lg p-4 border ${
              isClassicSelected
                ? "border-black bg-gray-100"
                : "border-gray-300 bg-gray-50"
            }`}
            onPress={() => settings.setColorTheme(CLASSIC)}
            android_ripple={{ color: "#D1D5DB" }}
            style={({ pressed }) => [
              {
                transform: [{ scale: pressed ? 0.98 : 1 }],
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text className="text-gray-900 text-3xl">Classic</Text>
            <View className="flex-row gap-2 mt-3">
              <View
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: CLASSIC.TEAM_ONE_COLOR }}
              />
              <View
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: CLASSIC.TEAM_TWO_COLOR }}
              />
              <View
                className="h-4 w-4 rounded"
                style={{ backgroundColor: CLASSIC.FELT_TOP, width: 24 }}
              />
            </View>
          </Pressable>

          <Pressable
            className={`w-1/4 self-left items-left justify-left rounded-lg p-4 border ${
              isSchoolhouseSelected
                ? "border-black bg-gray-100"
                : "border-gray-300 bg-gray-50"
            }`}
            onPress={() => settings.setColorTheme(SCHOOLHOUSE)}
            android_ripple={{ color: "#D1D5DB" }}
            style={({ pressed }) => [
              {
                transform: [{ scale: pressed ? 0.98 : 1 }],
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text className="text-gray-900 text-3xl">Schoolhouse</Text>
            <View className="flex-row gap-2 mt-3">
              <View
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: SCHOOLHOUSE.TEAM_ONE_COLOR }}
              />
              <View
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: SCHOOLHOUSE.TEAM_TWO_COLOR }}
              />
              <View
                className="h-4 w-4 rounded"
                style={{ backgroundColor: SCHOOLHOUSE.FELT_TOP, width: 24 }}
              />
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default Settings;
