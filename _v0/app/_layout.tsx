import "react-native-reanimated";

import LoadingScreen from "@/components/LoadingScreen";
import { GameProvider } from "@/context/GameContext";
import { useLogicUI } from "@/context/LogicContext";
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
  const { isGlobalLoading } = useLogicUI();
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="gamePlay" options={{ animation: "none" }} />
      </Stack>
      <LoadingScreen visible={isGlobalLoading} />
    </>
  );
}
