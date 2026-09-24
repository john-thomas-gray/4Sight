import type { PieceAnimation } from "@/types/animation";
import {
  WINNER_ENERGY_LOOP_MS,
  WINNER_GLOW_BLOOM_MS,
  WINNER_V0,
  WINNER_V1,
} from "@/types/animation";
import {
  Easing,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type AnimateWinnerPieceOptions = {
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
    winnerGlow,
    winnerEnergy,
  }: PieceAnimation,
  startDelayMs = 0,
  options?: AnimateWinnerPieceOptions,
) {
  const t0x = translateX.value;
  const t0y = translateY.value;
  const tierIndex = Math.round(startDelayMs / 140);
  const sideDrift = tierIndex % 2 === 0 ? -1 : 1;
  const liftMs = Math.round(WINNER_V1 * 0.58);
  const crestMs = WINNER_V1 - liftMs;
  const t1x = t0x + sideDrift * 4;
  const t2x = t0x - sideDrift * 2;
  const t1y = t0y - 19;
  const t2y = t0y - 7;

  const s0x = scaleX.value;
  const s0y = scaleY.value;
  const s1x = s0x * 1.28;
  const s1y = s0y * 1.28;
  const s2x = s0x * 1.13;
  const s2y = s0y * 1.13;

  translateX.value = withSequence(
    withDelay(
      startDelayMs,
      withTiming(t1x, {
        duration: liftMs,
        easing: Easing.out(Easing.cubic),
      }),
    ),
    withTiming(t2x, {
      duration: crestMs,
      easing: Easing.inOut(Easing.quad),
    }),
    withTiming(t0x, {
      duration: WINNER_V0,
      easing: Easing.bounce,
    }),
  );
  translateY.value = withSequence(
    withDelay(
      startDelayMs,
      withTiming(t1y, {
        duration: liftMs,
        easing: Easing.out(Easing.cubic),
      }),
    ),
    withTiming(t2y, {
      duration: crestMs,
      easing: Easing.inOut(Easing.quad),
    }),
    withTiming(t0y, {
      duration: WINNER_V0,
      easing: Easing.bounce,
    }),
  );
  scaleX.value = withSequence(
    withDelay(
      startDelayMs,
      withTiming(s1x, {
        duration: liftMs,
        easing: Easing.out(Easing.cubic),
      }),
    ),
    withTiming(s2x, {
      duration: crestMs,
      easing: Easing.inOut(Easing.quad),
    }),
    withTiming(s0x, {
      duration: WINNER_V0,
      easing: Easing.bounce,
    }),
  );
  scaleY.value = withSequence(
    withDelay(
      startDelayMs,
      withTiming(s1y, {
        duration: liftMs,
        easing: Easing.out(Easing.cubic),
      }),
    ),
    withTiming(s2y, {
      duration: crestMs,
      easing: Easing.inOut(Easing.quad),
    }),
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

  winnerGlow.value = withSequence(
    withDelay(
      startDelayMs,
      withTiming(1.18, {
        duration: WINNER_GLOW_BLOOM_MS,
        easing: Easing.out(Easing.cubic),
      }),
    ),
    withRepeat(
      withSequence(
        withTiming(0.82, {
          duration: 900,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(1.08, {
          duration: 900,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      -1,
    ),
  );
  winnerEnergy.value = withDelay(
    startDelayMs,
    withRepeat(
      withSequence(
        withTiming(1, {
          duration: WINNER_ENERGY_LOOP_MS,
          easing: Easing.linear,
        }),
        withTiming(0, { duration: 1 }),
      ),
      -1,
    ),
  );

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
