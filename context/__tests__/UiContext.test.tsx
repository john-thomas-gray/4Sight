import { Direction, Team } from "@/engine";
import { act, fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Pressable, Text } from "react-native";
import { UiProvider, useUi } from "../UiContext";

function UiProbe() {
  const ui = useUi();
  return (
    <>
      <Text testID="loading">{String(ui.isGlobalLoading)}</Text>
      <Text testID="move">{String(ui.moveInProgress)}</Text>
      <Text testID="gravity">{String(ui.gravityAnimating)}</Text>
      <Text testID="previewing">{String(ui.isPreviewingGravity)}</Text>
      <Text testID="preview-board">
        {ui.gravityPreviewBoard ? Object.keys(ui.gravityPreviewBoard).join(",") : ""}
      </Text>
      <Text testID="hover">{ui.hoverPreview?.spaceId ?? ""}</Text>
      <Text testID="slot-hint">{String(ui.slotDropHintActive)}</Text>
      <Text testID="well-pulse">
        {String(ui.tutorialWellPieceIdlePulseActive)}
      </Text>
      <Text testID="gravity-pulls">{String(ui.gravityPullEnabled)}</Text>
      <Text testID="pickup-locked">{String(ui.tutorialPiecePickupLocked)}</Text>
      <Text testID="banner-attention">
        {String(ui.tutorialBannerAttentionSignal)}
      </Text>
      <Text testID="inaccessible-slot">
        {ui.tutorialInaccessibleSlotEntryDirection ?? ""}
      </Text>
      <Text testID="slot-scale">{String(ui.slotRimOpeningScale.value)}</Text>
      <Pressable testID="toggle-ui" onPress={() => {
        ui.setIsGlobalLoading(true);
        ui.setGravityAnimating(true);
        ui.setIsPreviewingGravity(true);
        ui.setGravityPreviewBoard({ "1-1": "0" });
        ui.setHoverPreview({ spaceId: "3-3", team: Team.One });
        ui.setSlotDropHintActive(true);
        ui.setTutorialWellPieceIdlePulseActive(true);
        ui.setGravityPullEnabled(false);
        ui.setTutorialPiecePickupLocked(true);
        ui.setTutorialInaccessibleSlotEntryDirection(Direction.Down);
        ui.requestTutorialBannerAttention();
      }}>
        <Text>Toggle</Text>
      </Pressable>
      <Pressable testID="start-move" onPress={() => ui.setMoveInProgress(true)}>
        <Text>Start move</Text>
      </Pressable>
      <Pressable
        testID="delay-clear"
        onPress={() => ui.setMoveInProgressDelayed(false, 1000)}
      >
        <Text>Delay clear</Text>
      </Pressable>
    </>
  );
}

describe("UiProvider", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("exposes global loading, gravity previews, hover previews, and tutorial pulse flags", () => {
    const { getByTestId } = render(
      <UiProvider>
        <UiProbe />
      </UiProvider>,
    );

    expect(getByTestId("loading")).toHaveTextContent("false");
    expect(getByTestId("slot-scale")).toHaveTextContent("1");
    expect(getByTestId("gravity-pulls")).toHaveTextContent("true");
    expect(getByTestId("pickup-locked")).toHaveTextContent("false");
    expect(getByTestId("banner-attention")).toHaveTextContent("0");
    expect(getByTestId("inaccessible-slot")).toHaveTextContent("");

    fireEvent.press(getByTestId("toggle-ui"));

    expect(getByTestId("loading")).toHaveTextContent("true");
    expect(getByTestId("gravity")).toHaveTextContent("true");
    expect(getByTestId("previewing")).toHaveTextContent("true");
    expect(getByTestId("preview-board")).toHaveTextContent("1-1");
    expect(getByTestId("hover")).toHaveTextContent("3-3");
    expect(getByTestId("slot-hint")).toHaveTextContent("true");
    expect(getByTestId("well-pulse")).toHaveTextContent("true");
    expect(getByTestId("gravity-pulls")).toHaveTextContent("false");
    expect(getByTestId("pickup-locked")).toHaveTextContent("true");
    expect(getByTestId("banner-attention")).toHaveTextContent("1");
    expect(getByTestId("inaccessible-slot")).toHaveTextContent(Direction.Down);
  });

  it("delays move-in-progress changes and keeps the latest timer", () => {
    const { getByTestId } = render(
      <UiProvider>
        <UiProbe />
      </UiProvider>,
    );

    fireEvent.press(getByTestId("start-move"));
    expect(getByTestId("move")).toHaveTextContent("true");

    fireEvent.press(getByTestId("delay-clear"));
    act(() => {
      jest.advanceTimersByTime(999);
    });
    expect(getByTestId("move")).toHaveTextContent("true");

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(getByTestId("move")).toHaveTextContent("false");
  });
});
