import { Accelerometer } from "expo-sensors";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

type UseShakeOptions = {
  onShake: () => void;
  enabled?: boolean;
  minIntervalMs?: number;
  threshold?: number;
};

export const useShake = ({
  onShake,
  enabled = true,
  minIntervalMs = 1200,
  threshold = 4,
}: UseShakeOptions) => {
  const lastFireRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    if (Platform.OS === "web") return;

    let subscription: { remove: () => void } | null = null;
    let isActive = true;

    const start = async () => {
      if (
        typeof Accelerometer?.addListener !== "function" ||
        typeof Accelerometer?.setUpdateInterval !== "function"
      ) {
        return;
      }

      const isAvailable = await Accelerometer.isAvailableAsync?.();
      if (!isActive || isAvailable === false) return;

      Accelerometer.setUpdateInterval(100);

      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const magnitude = Math.sqrt(x * x + y * y + z * z);

        if (magnitude > threshold) {
          const now = Date.now();
          if (now - lastFireRef.current < minIntervalMs) return;

          lastFireRef.current = now;
          onShake();
        }
      });
    };

    void start();

    return () => {
      isActive = false;
      subscription?.remove();
    };
  }, [enabled, minIntervalMs, threshold, onShake]);
};
