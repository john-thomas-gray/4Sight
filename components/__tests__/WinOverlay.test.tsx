import { act, render } from "@testing-library/react-native";
import React from "react";
import WinOverlay from "../WinOverlay";

jest.mock("@/context/SettingsContext", () => ({
  useSettings: () => ({
    theme: {
      textAndFontTheme: { teamOneName: "Black", teamTwoName: "White" },
      colorTheme: { TEAM_ONE_COLOR: "#000", TEAM_TWO_COLOR: "#fff" },
    },
  }),
}));
jest.mock("../SurfaceGradient", () => () => null);
jest.mock("react-native-worklets", () => ({
  scheduleOnRN: (callback: () => void) => callback(),
}));

describe("WinOverlay", () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it("opens after being hidden, closes once, and can show a later win", () => {
    const onClose = jest.fn();
    const overlay = (visible: boolean) => (
      <WinOverlay visible={visible} winner="teamOne" onClose={onClose} />
    );
    const { queryByText, rerender } = render(overlay(false));
    expect(queryByText("Black Wins!")).toBeNull();
    rerender(overlay(true));
    expect(queryByText("Black Wins!")).toBeTruthy();
    act(() => { jest.advanceTimersByTime(2200); });
    expect(queryByText("Black Wins!")).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
    act(() => { jest.advanceTimersByTime(5000); });
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(overlay(false));
    rerender(overlay(true));
    expect(queryByText("Black Wins!")).toBeTruthy();
  });

  it("cancels automatic dismissal when the parent hides it early", () => {
    const onClose = jest.fn();
    const { queryByText, rerender } = render(
      <WinOverlay visible winner="teamTwo" onClose={onClose} />,
    );
    rerender(<WinOverlay visible={false} winner="teamTwo" onClose={onClose} />);
    expect(queryByText("White Wins!")).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
    act(() => { jest.advanceTimersByTime(5000); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
