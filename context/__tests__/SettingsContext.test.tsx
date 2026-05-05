import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Pressable, Text } from "react-native";
import { loadAppState, saveSettings } from "@/storage";
import { SettingsProvider, useSettings } from "../SettingsContext";

function SettingsProbe() {
  const settings = useSettings();
  return (
    <>
      <Text testID="theme">{settings.themeId}</Text>
      <Text testID="shift">{String(settings.shiftPreviews)}</Text>
      <Text testID="placement">{String(settings.piecePlacementPreviews)}</Text>
      <Text testID="highlight">{String(settings.highlightWinningMoves)}</Text>
      <Pressable
        testID="set-schoolhouse"
        onPress={() => settings.setThemeById("schoolhouse")}
      >
        <Text>Schoolhouse</Text>
      </Pressable>
      <Pressable
        testID="set-invalid"
        onPress={() => settings.setThemeById("missing")}
      >
        <Text>Invalid</Text>
      </Pressable>
      <Pressable
        testID="disable-shift"
        onPress={() => settings.setShiftPreviews(false)}
      >
        <Text>Disable shift</Text>
      </Pressable>
      <Pressable
        testID="enable-placement"
        onPress={() => settings.setPiecePlacementPreviews(true)}
      >
        <Text>Enable placement</Text>
      </Pressable>
      <Pressable
        testID="disable-highlight"
        onPress={() => settings.setHighlightWinningMoves(false)}
      >
        <Text>Disable highlight</Text>
      </Pressable>
    </>
  );
}

describe("SettingsProvider", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it("loads persisted settings and saves updates", async () => {
    await saveSettings({
      themeId: "seaside",
      shiftPreviews: true,
      piecePlacementPreviews: false,
      highlightWinningMoves: true,
    });

    const { getByTestId } = render(
      <SettingsProvider>
        <SettingsProbe />
      </SettingsProvider>,
    );

    await waitFor(() => expect(getByTestId("theme")).toHaveTextContent("seaside"));
    expect(getByTestId("placement")).toHaveTextContent("false");

    fireEvent.press(getByTestId("set-schoolhouse"));
    fireEvent.press(getByTestId("disable-shift"));
    fireEvent.press(getByTestId("enable-placement"));
    fireEvent.press(getByTestId("disable-highlight"));

    await waitFor(() => {
      expect(getByTestId("theme")).toHaveTextContent("schoolhouse");
      expect(getByTestId("shift")).toHaveTextContent("false");
      expect(getByTestId("placement")).toHaveTextContent("true");
      expect(getByTestId("highlight")).toHaveTextContent("false");
    });

    await waitFor(async () => {
      const state = await loadAppState();
      expect(state.settings).toEqual({
        themeId: "schoolhouse",
        shiftPreviews: false,
        piecePlacementPreviews: true,
        highlightWinningMoves: false,
      });
    });
  });

  it("ignores unknown theme ids", async () => {
    const { getByTestId } = render(
      <SettingsProvider>
        <SettingsProbe />
      </SettingsProvider>,
    );

    await waitFor(() => expect(getByTestId("theme")).toHaveTextContent("classic"));
    fireEvent.press(getByTestId("set-invalid"));

    expect(getByTestId("theme")).toHaveTextContent("classic");
  });
});
