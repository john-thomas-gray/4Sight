import { Accelerometer } from "expo-sensors";
import { useEffect, useRef } from "react";

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

    Accelerometer.setUpdateInterval(100);

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      // Normal gravity is around 1g; shaking adds spikes > threshold
      if (magnitude > threshold) {
        const now = Date.now();
        if (now - lastFireRef.current < minIntervalMs) return;

        lastFireRef.current = now;
        onShake();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [enabled, minIntervalMs, threshold, onShake]);
};

export default useShake;
