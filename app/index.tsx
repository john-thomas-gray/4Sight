import { useGameContext } from "@/context/GameContext";
import { useLogicGameFlow, useLogicUI } from "@/context/LogicContext";
import { useDebouncedPress } from "@/hooks/useDebouncedPress";
import { clearSavedGame, loadAppState } from "@/utils/useAsyncStorage";
import { useFocusEffect, useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function Index() {
  return (
    <GestureHandlerRootView className="flex-1">
      <InnerIndexLayout />
    </GestureHandlerRootView>
  );
}

function InnerIndexLayout() {
  const router = useRouter();
  const { settings } = useGameContext();
  const { resetGame, continueGame, hasSavedGame, refreshHasSavedGame } =
    useLogicGameFlow();

  const { setIsGlobalLoading } = useLogicUI();

  React.useEffect(() => {
    refreshHasSavedGame();
  }, [refreshHasSavedGame]);

  // Refresh saved-game visibility whenever this screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      refreshHasSavedGame();
    }, [refreshHasSavedGame])
  );

  const handlePlay = React.useCallback(async () => {
    setIsGlobalLoading(true);
    resetGame();
    await clearSavedGame();
    await refreshHasSavedGame();
    router.replace("/gamePlay");
  }, [setIsGlobalLoading, resetGame, refreshHasSavedGame]);

  const handleContinue = React.useCallback(async () => {
    setIsGlobalLoading(true);
    const saved = await loadAppState();
    if (saved) {
      continueGame(saved);
    }
    router.replace("/gamePlay");
  }, [setIsGlobalLoading, continueGame]);

  const onPressPlay = useDebouncedPress(handlePlay);
  const onPressContinue = useDebouncedPress(handleContinue);
  const onPressSettings = useDebouncedPress(() => router.push("/settings"));

  return (
    <View
      className="flex-1 items-center justify-evenly"
      style={{
        backgroundColor: settings.theme?.colorTheme?.FELT_TOP || "#222",
      }}
    >
      <View className="flex-row items-end items-center">
        <Text
          className="font-bold text-[128px] mb-4"
          style={{
            color: settings.theme?.colorTheme?.ODD_SPACE_COLOR || "#ffffff",
          }}
        >
          4
        </Text>
        <Text
          className="font-bold text-8xl ml-2"
          style={{
            color: settings.theme?.colorTheme?.ODD_SPACE_COLOR || "#ffffff",
          }}
        >
          Sight
        </Text>
      </View>
      <View className="flex-col items-center space-y-4">
        <Pressable onPress={onPressPlay}>
          <Text
            className="text-3xl"
            style={{
              color: settings.theme?.colorTheme?.ODD_SPACE_COLOR || "#ffffff",
            }}
          >
            {settings.tutorialEnabled ? "Tutorial" : "New Game"}
          </Text>
        </Pressable>
        {hasSavedGame && (
          <Pressable onPress={onPressContinue}>
            <Text
              className="text-3xl"
              style={{
                color: settings.theme?.colorTheme?.ODD_SPACE_COLOR || "#ffffff",
              }}
            >
              Continue
            </Text>
          </Pressable>
        )}
        <Pressable onPress={onPressSettings}>
          <Text
            className="text-3xl"
            style={{
              color: settings.theme?.colorTheme?.ODD_SPACE_COLOR || "#ffffff",
            }}
          >
            Settings
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
