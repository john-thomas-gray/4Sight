import "react-native-reanimated";

import { GameProvider } from "@/context/GameContext";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

export default function RootLayout() {
  return (
    <GameProvider>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </GameProvider>
  );
}
