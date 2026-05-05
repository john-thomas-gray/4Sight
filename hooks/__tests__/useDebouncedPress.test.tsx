import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Pressable, Text } from "react-native";
import { useDebouncedPress } from "../useDebouncedPress";

function Probe({
  onPress,
  delayMs = 500,
}: {
  onPress: () => void;
  delayMs?: number;
}) {
  const debounced = useDebouncedPress(onPress, delayMs);
  return (
    <Pressable testID="button" onPress={debounced}>
      <Text>Press</Text>
    </Pressable>
  );
}

describe("useDebouncedPress", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("ignores repeat presses until the debounce window has elapsed", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<Probe onPress={onPress} delayMs={250} />);

    fireEvent.press(getByTestId("button"));
    fireEvent.press(getByTestId("button"));
    expect(onPress).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(249);
    fireEvent.press(getByTestId("button"));
    expect(onPress).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1);
    fireEvent.press(getByTestId("button"));
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("uses the latest callback after rerender", () => {
    const first = jest.fn();
    const second = jest.fn();
    const { getByTestId, rerender } = render(
      <Probe onPress={first} delayMs={100} />,
    );

    rerender(<Probe onPress={second} delayMs={100} />);
    fireEvent.press(getByTestId("button"));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
