import { act, render, waitFor } from "@testing-library/react-native";
import { Accelerometer } from "expo-sensors";
import React from "react";
import { Platform } from "react-native";
import { useShake } from "../useShake";

jest.mock("expo-sensors", () => ({
  Accelerometer: {
    addListener: jest.fn(),
    isAvailableAsync: jest.fn(),
    setUpdateInterval: jest.fn(),
  },
}));

type AccelListener = (sample: { x: number; y: number; z: number }) => void;

function Probe({
  enabled = true,
  onShake,
}: {
  enabled?: boolean;
  onShake: () => void;
}) {
  useShake({ enabled, minIntervalMs: 1000, onShake, threshold: 4 });
  return null;
}

describe("useShake", () => {
  let listener: AccelListener | null = null;
  let remove: jest.Mock;
  let now = 2000;

  beforeEach(() => {
    jest.clearAllMocks();
    listener = null;
    remove = jest.fn();
    now = 2000;
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: "ios",
    });
    jest.spyOn(Date, "now").mockImplementation(() => now);
    jest.mocked(Accelerometer.isAvailableAsync).mockResolvedValue(true);
    jest.mocked(Accelerometer.addListener).mockImplementation((cb) => {
      listener = cb as AccelListener;
      return { remove };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("fires on strong shakes and throttles repeated shakes", async () => {
    const onShake = jest.fn();
    render(<Probe onShake={onShake} />);

    await waitFor(() => {
      expect(Accelerometer.setUpdateInterval).toHaveBeenCalledWith(100);
      expect(listener).not.toBeNull();
    });

    act(() => {
      listener?.({ x: 5, y: 0, z: 0 });
    });
    expect(onShake).toHaveBeenCalledTimes(1);

    now = 2500;
    act(() => {
      listener?.({ x: 5, y: 0, z: 0 });
    });
    expect(onShake).toHaveBeenCalledTimes(1);

    now = 3001;
    act(() => {
      listener?.({ x: 5, y: 0, z: 0 });
    });
    expect(onShake).toHaveBeenCalledTimes(2);
  });

  it("does not subscribe when disabled or unavailable", async () => {
    const onShake = jest.fn();
    const { unmount } = render(<Probe enabled={false} onShake={onShake} />);

    await Promise.resolve();
    expect(Accelerometer.addListener).not.toHaveBeenCalled();
    unmount();

    jest.mocked(Accelerometer.isAvailableAsync).mockResolvedValue(false);
    render(<Probe onShake={onShake} />);
    await waitFor(() => {
      expect(Accelerometer.isAvailableAsync).toHaveBeenCalled();
    });
    expect(Accelerometer.addListener).not.toHaveBeenCalled();
  });

  it("removes the accelerometer listener on unmount", async () => {
    const { unmount } = render(<Probe onShake={jest.fn()} />);
    await waitFor(() => expect(listener).not.toBeNull());

    unmount();

    expect(remove).toHaveBeenCalledTimes(1);
  });
});
