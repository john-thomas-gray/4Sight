import type { PieceAnimation } from "@/types/animation";
import { WINNER_V0, WINNER_V1 } from "@/types/animation";
import {
  Easing,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export type AnimateWinnerPieceOptions = {
  /** Motion/scale only; omit gold color sweep (caller reveals gold at apex separately). */
  skipColor?: boolean;
};

export function animateWinnerPiece(
  {
    translateX,
    translateY,
    scaleX,
    scaleY,
    color,
    winnerColor,
  }: PieceAnimation,
  startDelayMs = 0,
  options?: AnimateWinnerPieceOptions,
) {
  const t0x = translateX.value;
  const t0y = translateY.value;
  const t1x = t0x - 5;
  const t1y = t0y - 15;

  const s0x = scaleX.value;
  const s0y = scaleY.value;
  const s1x = s0x * 1.3;
  const s1y = s0y * 1.3;

  translateX.value = withSequence(
    withDelay(
      startDelayMs,
      withTiming(t1x, {
        duration: WINNER_V1,
        easing: Easing.inOut(Easing.exp),
      }),
    ),
    withTiming(t0x, {
      duration: WINNER_V0,
      easing: Easing.bounce,
    }),
  );
  translateY.value = withSequence(
    withDelay(
      startDelayMs,
      withTiming(t1y, {
        duration: WINNER_V1,
        easing: Easing.inOut(Easing.exp),
      }),
    ),
    withTiming(t0y, {
      duration: WINNER_V0,
      easing: Easing.bounce,
    }),
  );
  scaleX.value = withSequence(
    withDelay(
      startDelayMs,
      withTiming(s1x, {
        duration: WINNER_V1,
        easing: Easing.inOut(Easing.exp),
      }),
    ),
    withTiming(s0x, {
      duration: WINNER_V0,
      easing: Easing.bounce,
    }),
  );
  scaleY.value = withSequence(
    withDelay(
      startDelayMs,
      withTiming(s1y, {
        duration: WINNER_V1,
        easing: Easing.inOut(Easing.exp),
      }),
    ),
    withTiming(s0y, {
      duration: WINNER_V0,
      easing: Easing.bounce,
    }),
  );

  if (!options?.skipColor) {
    color.value = withDelay(
      startDelayMs,
      withTiming(winnerColor.value, {
        duration: WINNER_V1,
        easing: Easing.inOut(Easing.exp),
      }),
    );
  }

  // Start a subtle pulse after the entry animation completes.
  const pulseDelay = startDelayMs + WINNER_V1 + WINNER_V0;
  scaleX.value = withDelay(
    pulseDelay,
    withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1500 }),
        withTiming(1, { duration: 1500 }),
      ),
      -1,
    ),
  );
  scaleY.value = withDelay(
    pulseDelay,
    withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1500 }),
        withTiming(1, { duration: 1500 }),
      ),
      -1,
    ),
  );
}
