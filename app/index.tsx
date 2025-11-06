import { useGameContext } from "@/context/GameContext";
import { useLogicGameFlow, useLogicUI } from "@/context/LogicContext";
import { useDebouncedPress } from "@/hooks/useDebouncedPress";
import { clearSavedGame, loadAppState } from "@/utils/useAsyncStorage";
import { useFocusEffect, useRouter } from "expo-router";
import React from "react";
import { LayoutChangeEvent, Pressable, Text, View } from "react-native";
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
  }, [router, refreshHasSavedGame, resetGame, setIsGlobalLoading]);

  const handleContinue = React.useCallback(async () => {
    setIsGlobalLoading(true);
    const saved = await loadAppState();
    if (saved) {
      continueGame(saved);
    }
    router.replace("/gamePlay");
  }, [continueGame, router, setIsGlobalLoading]);

  const onPressPlay = useDebouncedPress(handlePlay);
  const onPressContinue = useDebouncedPress(handleContinue);
  const onPressSettings = useDebouncedPress(() => router.push("/settings"));

  type ButtonId = "play" | "continue" | "settings";
  const [buttonWidths, setButtonWidths] = React.useState<
    Partial<Record<ButtonId, number>>
  >({});

  const handleButtonLayout = React.useCallback(
    (id: ButtonId) => (event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout;
      setButtonWidths((prev) => {
        if (prev[id] === width) {
          return prev;
        }
        return { ...prev, [id]: width };
      });
    },
    []
  );

  React.useEffect(() => {
    if (!hasSavedGame) {
      setButtonWidths((prev) => {
        if (!("continue" in prev)) {
          return prev;
        }
        const { ["continue"]: _unused, ...rest } = prev;
        return rest;
      });
    }
  }, [hasSavedGame]);

  const maxButtonWidth = React.useMemo(() => {
    const activeKeys: ButtonId[] = hasSavedGame
      ? ["play", "continue", "settings"]
      : ["play", "settings"];
    let max = 0;
    for (const key of activeKeys) {
      const value = buttonWidths[key];
      if (typeof value === "number" && value > max) {
        max = value;
      }
    }
    return max;
  }, [buttonWidths, hasSavedGame]);

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
        <Pressable
          onPress={onPressPlay}
          onLayout={handleButtonLayout("play")}
          className="items-center justify-center rounded-lg px-4 py-1 border mb-2"
          style={[
            {
              borderColor: settings.theme?.colorTheme?.SLOT_BORDER_COLOR,
              backgroundColor: settings.theme?.colorTheme?.WELL_BG_COLOR_TWO,
              borderWidth: 1,
            },
            maxButtonWidth > 0 ? { minWidth: maxButtonWidth } : null,
          ]}
        >
          <Text
            className="text-3xl"
            style={{
              textAlign: "center",
              color: settings.theme?.colorTheme?.ODD_SPACE_COLOR || "#ffffff",
            }}
          >
            {settings.tutorialEnabled ? "Tutorial" : "New Game"}
          </Text>
        </Pressable>
        {hasSavedGame && (
          <Pressable
            onPress={onPressContinue}
            onLayout={handleButtonLayout("continue")}
            className="items-center justify-center rounded-lg px-4 py-1 border mb-2"
            style={[
              {
                borderColor: settings.theme?.colorTheme?.SLOT_BORDER_COLOR,
                backgroundColor: settings.theme?.colorTheme?.WELL_BG_COLOR_TWO,
                borderWidth: 1,
              },
              maxButtonWidth > 0 ? { minWidth: maxButtonWidth } : null,
            ]}
          >
            <Text
              className="text-3xl"
              style={{
                textAlign: "center",
                color: settings.theme?.colorTheme?.ODD_SPACE_COLOR || "#ffffff",
              }}
            >
              Continue
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={onPressSettings}
          onLayout={handleButtonLayout("settings")}
          className="items-center justify-center rounded-lg px-4 py-1 border mb-2"
          style={[
            {
              borderColor: settings.theme?.colorTheme?.SLOT_BORDER_COLOR,
              backgroundColor: settings.theme?.colorTheme?.WELL_BG_COLOR_TWO,
              borderWidth: 1,
            },
            maxButtonWidth > 0 ? { minWidth: maxButtonWidth } : null,
          ]}
        >
          <Text
            className="text-3xl"
            style={{
              textAlign: "center",
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
