import "react-native-reanimated";

import LoadingScreen from "@/components/LoadingScreen";
import { GameProvider, useGameContext } from "@/context/GameContext";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

export default function RootLayout() {
  return (
    <GameProvider>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootWithGlobalLoading />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </GameProvider>
  );
}

function RootWithGlobalLoading() {
  const { logic } = useGameContext();
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <LoadingScreen visible={logic.isGlobalLoading} />
    </>
  );
}
