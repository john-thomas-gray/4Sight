import { act, render } from "@testing-library/react-native";
import React from "react";
import { withSpring, withTiming } from "react-native-reanimated";
import TutorialStepBanner from "../tutorial/TutorialStepBanner";

jest.mock("react-native-safe-area-context", () => ({
  ...jest.requireActual("react-native-safe-area-context"),
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe("TutorialStepBanner", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.mocked(withSpring).mockClear();
    jest.mocked(withTiming).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("drops in from the top and exits upward before unmounting", () => {
    const { getByText, queryByText, rerender } = render(
      <TutorialStepBanner
        visible
        message="Touch the piece"
        textColor="#fff"
        slotBorderColor="#111"
        wellBgColor="#222"
      />,
    );

    expect(getByText("Touch the piece")).toBeTruthy();
    expect(jest.mocked(withSpring)).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ damping: expect.any(Number) }),
    );

    jest.mocked(withTiming).mockClear();
    rerender(
      <TutorialStepBanner
        visible={false}
        message="Touch the piece"
        textColor="#fff"
        slotBorderColor="#111"
        wellBgColor="#222"
      />,
    );

    expect(queryByText("Touch the piece")).toBeTruthy();
    expect(
      jest.mocked(withTiming).mock.calls.some(([toValue]) => {
        return typeof toValue === "number" && toValue < 0;
      }),
    ).toBe(true);

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(queryByText("Touch the piece")).toBeNull();
  });

  it("grows the text, shakes it on the z axis, and pops the modal edges", () => {
    const { rerender } = render(
      <TutorialStepBanner
        visible
        message="Shift gravity"
        textColor="#fff"
        slotBorderColor="#111"
        wellBgColor="#222"
        attentionSignal={0}
      />,
    );

    jest.mocked(withTiming).mockClear();
    rerender(
      <TutorialStepBanner
        visible
        message="Shift gravity"
        textColor="#fff"
        slotBorderColor="#111"
        wellBgColor="#222"
        attentionSignal={1}
      />,
    );

    expect(jest.mocked(withTiming)).toHaveBeenCalledWith(1.2, {
      duration: 90,
    });
    expect(jest.mocked(withTiming)).toHaveBeenCalledWith(1.07, {
      duration: 90,
    });
    expect(
      jest.mocked(withTiming).mock.calls.some(([toValue]) => {
        return typeof toValue === "number" && Math.abs(toValue) === 7;
      }),
    ).toBe(true);
  });
});
