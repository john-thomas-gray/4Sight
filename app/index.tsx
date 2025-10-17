import { useGameContext } from "@/context/GameContext";
import { useDebouncedPress } from "@/hooks/useDebouncedPress";
import { GameState } from "@/types/logic";
import type { PersistedAppState } from "@/utils/useAsyncStorage";
import { clearSavedGame, loadAppState } from "@/utils/useAsyncStorage";
import { router, useFocusEffect } from "expo-router";
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
  const { logic } = useGameContext();
  const [hasSavedGame, setHasSavedGame] = React.useState(false);

  const computeHasSavedGame = React.useCallback((saved: PersistedAppState) => {
    const hasBoard = Boolean(
      saved.boardPieceLocations &&
        Object.keys(saved.boardPieceLocations).length > 0
    );
    console.log("boardpieces", saved.boardPieceLocations);
    console.log(hasBoard);
    return hasBoard;
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const saved = await loadAppState();
      const has = computeHasSavedGame(saved as PersistedAppState);
      console.log("has", has);
      if (mounted) setHasSavedGame(has);
    })();
    return () => {
      mounted = false;
    };
  }, [computeHasSavedGame]);

  // Refresh saved-game visibility whenever this screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      (async () => {
        const saved = await loadAppState();
        const has = computeHasSavedGame(saved as PersistedAppState);
        if (active) setHasSavedGame(has);
      })();
      return () => {
        active = false;
      };
    }, [computeHasSavedGame])
  );

  const handlePlay = React.useCallback(async () => {
    logic.setIsGlobalLoading(true);
    logic.resetGame(1, false);
    await clearSavedGame();
    router.replace("/gamePlay");
  }, [logic]);

  const handleContinue = React.useCallback(async () => {
    logic.setIsGlobalLoading(true);
    const saved = await loadAppState();
    logic.rehydrateFromSavedState(saved);
    logic.setGameState(GameState.Playing);
    router.replace("/gamePlay");
  }, [logic]);

  const onPressPlay = useDebouncedPress(handlePlay);
  const onPressContinue = useDebouncedPress(handleContinue);
  const onPressSettings = useDebouncedPress(() => router.push("/settings"));
  const onPressHowTo = useDebouncedPress(() => router.push("/howToPlay"));

  return (
    <View className="flex-1 border-2 border-red-50 items-center justify-evenly bg-white">
      <View className="flex-row items-end items-center">
        <Text className="text-black font-bold text-[128px] mb-4">4</Text>
        <Text className="text-black font-bold text-8xl ml-2">Sight</Text>
      </View>
      <View className="flex-col items-center space-y-4">
        <Pressable onPress={onPressPlay}>
          <Text className="text-3xl">New Game</Text>
        </Pressable>
        {hasSavedGame && (
          <Pressable onPress={onPressContinue}>
            <Text className="text-3xl">Continue</Text>
          </Pressable>
        )}
        <Pressable onPress={onPressSettings}>
          <Text className="text-lg">Settings</Text>
        </Pressable>
        <Pressable onPress={onPressHowTo}>
          <Text className="text-lg">How to Play</Text>
        </Pressable>
      </View>
    </View>
  );
}
