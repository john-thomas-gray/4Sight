import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import BackButton from "../BackButton";

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

describe("BackButton", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockReplace.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("navigates to the main menu and debounces rapid presses", () => {
    const { getByRole } = render(<BackButton />);
    const button = getByRole("button");

    fireEvent.press(button);
    fireEvent.press(button);

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/");

    jest.advanceTimersByTime(500);
    fireEvent.press(button);

    expect(mockReplace).toHaveBeenCalledTimes(2);
  });
});
