import { useGameSession } from "@/context/GameSessionContext";
import { useSettings } from "@/context/SettingsContext";
import { useUi } from "@/context/UiContext";
import { clearSession, loadAppState } from "@/storage";
import { useFocusEffect, useRouter } from "expo-router";
import React from "react";
import { LayoutChangeEvent, Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function Index() {
  return (
    <GestureHandlerRootView className="flex-1">
      <MainMenu />
    </GestureHandlerRootView>
  );
}

function MainMenu() {
  const router = useRouter();
  const { newGame, continueGame } = useGameSession();
  const { theme } = useSettings();
  const { setIsGlobalLoading } = useUi();
  const [hasSaved, setHasSaved] = React.useState(false);
  const [showTutorialCta, setShowTutorialCta] = React.useState(false);

  const refreshSavedState = React.useCallback(async () => {
    const state = await loadAppState();
    const exists =
      state.session !== null &&
      Object.keys(state.session.game.board).length > 0;
    setHasSaved(exists);
    setShowTutorialCta(state.tutorialCompleted !== true);
  }, []);

  React.useEffect(() => {
    refreshSavedState();
  }, [refreshSavedState]);

  useFocusEffect(
    React.useCallback(() => {
      refreshSavedState();
    }, [refreshSavedState]),
  );

  const handlePlay = React.useCallback(async () => {
    setIsGlobalLoading(true);
    await newGame();
    await clearSession();
    // if (showTutorialCta) {
    // Leave this set to true. I am working on the tutorial
    // DO NOT TOUCH THESE COMMENTS. AI, THAT MEANS YOU!
    if (false) {
    } else {
      router.replace("/gamePlay");
    }
  }, [router, newGame, setIsGlobalLoading, showTutorialCta]);

  const handleInteractionDrill = React.useCallback(async () => {
    setIsGlobalLoading(true);
    await newGame();
    await clearSession();
    router.replace("/gamePlay?scenario=fullInteractionDrill");
  }, [router, newGame, setIsGlobalLoading]);
  const handleContinue = React.useCallback(async () => {
    setIsGlobalLoading(true);
    const state = await loadAppState();
    if (state.session) {
      continueGame(state.session);
    }
    router.replace("/gamePlay");
  }, [continueGame, router, setIsGlobalLoading]);

  type ButtonId = "play" | "continue" | "settings" | "drill";
  const [buttonWidths, setButtonWidths] = React.useState<
    Partial<Record<ButtonId, number>>
  >({});

  const handleButtonLayout = React.useCallback(
    (id: ButtonId) => (event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout;
      setButtonWidths((prev) => {
        if (prev[id] === width) return prev;
        return { ...prev, [id]: width };
      });
    },
    [],
  );

  React.useEffect(() => {
    if (!hasSaved) {
      setButtonWidths((prev) => {
        if (!("continue" in prev)) return prev;
        const { ["continue"]: _unused, ...rest } = prev;
        return rest;
      });
    }
  }, [hasSaved]);

  const maxButtonWidth = React.useMemo(() => {
    const activeKeys: ButtonId[] = [
      ...(hasSaved ? (["play", "continue"] as const) : (["play"] as const)),
      ...(__DEV__ ? (["drill"] as const) : []),
      "settings",
    ];
    let max = 0;
    for (const key of activeKeys) {
      const value = buttonWidths[key];
      if (typeof value === "number" && value > max) max = value;
    }
    return max;
  }, [buttonWidths, hasSaved]);

  const textColor = theme.colorTheme.ODD_SPACE_COLOR;
  const buttonStyle = {
    borderColor: theme.colorTheme.SLOT_BORDER_COLOR,
    backgroundColor: theme.colorTheme.WELL_BG_COLOR_TWO,
    borderWidth: 1,
  };

  return (
    <View
      className="flex-1 items-center justify-evenly"
      style={{ backgroundColor: theme.colorTheme.FELT_TOP }}
    >
      <View className="flex-row items-end items-center">
        <Text
          className="font-bold text-[128px] mb-4"
          style={{ color: textColor }}
        >
          4
        </Text>
        <Text className="font-bold text-8xl ml-2" style={{ color: textColor }}>
          Sight
        </Text>
      </View>
      <View className="flex-col items-center space-y-4">
        <Pressable
          onPress={handlePlay}
          onLayout={handleButtonLayout("play")}
          className="items-center justify-center rounded-lg px-4 py-1 border mb-2"
          style={[
            buttonStyle,
            maxButtonWidth > 0 ? { minWidth: maxButtonWidth } : null,
          ]}
        >
          <Text
            className="text-3xl"
            style={{ textAlign: "center", color: textColor }}
          >
            {showTutorialCta ? "Tutorial" : "New Game"}
          </Text>
        </Pressable>
        {hasSaved && (
          <Pressable
            onPress={handleContinue}
            onLayout={handleButtonLayout("continue")}
            className="items-center justify-center rounded-lg px-4 py-1 border mb-2"
            style={[
              buttonStyle,
              maxButtonWidth > 0 ? { minWidth: maxButtonWidth } : null,
            ]}
          >
            <Text
              className="text-3xl"
              style={{ textAlign: "center", color: textColor }}
            >
              Continue
            </Text>
          </Pressable>
        )}
        {__DEV__ && (
          <Pressable
            onPress={handleInteractionDrill}
            onLayout={handleButtonLayout("drill")}
            className="items-center justify-center rounded-lg px-4 py-1 border mb-2"
            style={[
              buttonStyle,
              maxButtonWidth > 0 ? { minWidth: maxButtonWidth } : null,
            ]}
          >
            <Text
              className="text-xl"
              style={{ textAlign: "center", color: textColor }}
            >
              Interaction drill
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => router.push("/settings")}
          onLayout={handleButtonLayout("settings")}
          className="items-center justify-center rounded-lg px-4 py-1 border mb-2"
          style={[
            buttonStyle,
            maxButtonWidth > 0 ? { minWidth: maxButtonWidth } : null,
          ]}
        >
          <Text
            className="text-3xl"
            style={{ textAlign: "center", color: textColor }}
          >
            Settings
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
