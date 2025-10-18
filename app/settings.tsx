import BackButton from "@/components/BackButton";
import { CLASSIC } from "@/constants/themes/classic";
import { SCHOOLHOUSE } from "@/constants/themes/schoolhouse";
import { useGameContext } from "@/context/GameContext";
import React from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Settings = () => {
  const { settings } = useGameContext();
  const isSameTheme = (a: typeof CLASSIC | undefined, b: typeof CLASSIC) => {
    if (!a || !a.colorTheme) return false;
    return (
      a.colorTheme.TEAM_ONE_COLOR === b.colorTheme.TEAM_ONE_COLOR &&
      a.colorTheme.TEAM_TWO_COLOR === b.colorTheme.TEAM_TWO_COLOR &&
      a.colorTheme.FELT_TOP === b.colorTheme.FELT_TOP
    );
  };
  const isClassicSelected = isSameTheme(settings.theme, CLASSIC);
  const isSchoolhouseSelected = isSameTheme(settings.theme, SCHOOLHOUSE);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-6 pb-4">
        <Text className="text-4xl font-bold text-gray-900">Settings</Text>
      </View>

      <View className="px-6">
        <Text className="text-2xl font-semibold text-gray-800 mb-3">
          Themes
        </Text>
        <View className="flex-col gap-4">
          <Pressable
            className={`w-full items-start justify-start rounded-lg p-4 border ${
              isClassicSelected
                ? "border-black bg-gray-100"
                : "border-gray-300 bg-gray-50"
            }`}
            onPress={() => settings.setTheme(CLASSIC)}
            android_ripple={{ color: "#D1D5DB" }}
            style={({ pressed }) => [
              {
                transform: [{ scale: pressed ? 0.98 : 1 }],
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text className="text-gray-900 text-2xl">Classic</Text>
            <View className="flex-row gap-2 mt-3">
              <View
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: CLASSIC.colorTheme.TEAM_ONE_COLOR }}
              />
              <View
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: CLASSIC.colorTheme.TEAM_TWO_COLOR }}
              />
              <View
                className="h-4 w-4 rounded"
                style={{
                  backgroundColor: CLASSIC.colorTheme.FELT_TOP,
                  width: 24,
                }}
              />
            </View>
          </Pressable>

          <Pressable
            className={`w-full items-start justify-start rounded-lg p-4 border ${
              isSchoolhouseSelected
                ? "border-black bg-gray-100"
                : "border-gray-300 bg-gray-50"
            }`}
            onPress={() => settings.setTheme(SCHOOLHOUSE)}
            android_ripple={{ color: "#D1D5DB" }}
            style={({ pressed }) => [
              {
                transform: [{ scale: pressed ? 0.98 : 1 }],
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text className="text-gray-900 text-2xl">Schoolhouse</Text>
            <View className="flex-row gap-2 mt-3">
              <View
                className="h-4 w-4 rounded-full"
                style={{
                  backgroundColor: SCHOOLHOUSE.colorTheme.TEAM_ONE_COLOR,
                }}
              />
              <View
                className="h-4 w-4 rounded-full"
                style={{
                  backgroundColor: SCHOOLHOUSE.colorTheme.TEAM_TWO_COLOR,
                }}
              />
              <View
                className="h-4 w-4 rounded"
                style={{
                  backgroundColor: SCHOOLHOUSE.colorTheme.FELT_TOP,
                  width: 24,
                }}
              />
            </View>
          </Pressable>
        </View>
      </View>
      <View className="px-6 mt-8">
        <Text className="text-2xl font-semibold text-gray-800 mb-3">
          Gameplay
        </Text>
        <View className="flex-col gap-4">
          <View className="w-full rounded-lg p-4 border border-gray-300 bg-gray-50">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-900 text-xl">Tutorial</Text>
              <Switch
                value={settings.tutorialEnabled}
                onValueChange={settings.setTutorialEnabled}
              />
            </View>
            <Text className="text-gray-600 mt-2">
              An interactive tutorial explains the rules.
            </Text>
          </View>

          <View className="w-full rounded-lg p-4 border border-gray-300 bg-gray-50">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-900 text-xl">Shift Previews</Text>
              <Switch
                value={settings.shiftPreviews}
                onValueChange={settings.setShiftPreviews}
              />
            </View>
            <Text className="text-gray-600 mt-2">
              Shows a preview of where pieces will settle after a gravity shift.
            </Text>
          </View>

          <View className="w-full rounded-lg p-4 border border-gray-300 bg-gray-50">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-900 text-xl">
                Piece Placement Previews
              </Text>
              <Switch
                value={settings.piecePlacementPreviews}
                onValueChange={settings.setPiecePlacementPreviews}
              />
            </View>
            <Text className="text-gray-600 mt-2">
              Shows a preview of where a piece will fall once dropped in a slot.
            </Text>
          </View>

          <View className="w-full rounded-lg p-4 border border-gray-300 bg-gray-50">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-900 text-xl">
                Highlight Winning Moves
              </Text>
              <Switch
                value={settings.highlightWinningMoves}
                onValueChange={settings.setHighlightWinningMoves}
              />
            </View>
            <Text className="text-gray-600 mt-2">
              Highlights spaces where a player can place a piece to win the
              game.
            </Text>
          </View>
        </View>
      </View>
      <BackButton />
    </SafeAreaView>
  );
};

export default Settings;
