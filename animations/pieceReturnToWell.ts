import { GameElements } from "@/constants";
import { RETURN_TO_WELL, type PieceAnimation } from "@/types/animation";
import { Easing, withSequence, withTiming } from "react-native-reanimated";

export const PIECE_RETURN_TO_WELL_CENTER_MS = RETURN_TO_WELL;
export const PIECE_RETURN_TO_WELL_LIFT_SETTLE_MS = 90;
export const PIECE_RETURN_TO_WELL_LOWER_MS = 110;
export const PIECE_RETURN_TO_WELL_TOTAL_MS =
  PIECE_RETURN_TO_WELL_CENTER_MS + PIECE_RETURN_TO_WELL_LOWER_MS;

/**
 * From a held-style presentation, animate translation to well center, then
 * lower into the resting well size only after the piece is centered.
 */
export function animatePieceReturnToWellResting(
  anim: PieceAnimation,
  targetX: number,
  targetY: number,
): void {
  anim.scaleX.value = GameElements.PIECE_HELD_SCALE;
  anim.scaleY.value = GameElements.PIECE_HELD_SCALE;
  anim.zIndex.value = GameElements.PIECE_HELD_ZINDEX;

  anim.translateX.value = withSequence(
    withTiming(targetX, {
      duration: PIECE_RETURN_TO_WELL_CENTER_MS,
      easing: Easing.inOut(Easing.quad),
    }),
    withTiming(targetX, { duration: PIECE_RETURN_TO_WELL_LOWER_MS }),
  );
  anim.translateY.value = withSequence(
    withTiming(targetY, {
      duration: PIECE_RETURN_TO_WELL_CENTER_MS,
      easing: Easing.inOut(Easing.quad),
    }),
    withTiming(targetY, { duration: PIECE_RETURN_TO_WELL_LOWER_MS }),
  );
  anim.scaleX.value = withSequence(
    withTiming(GameElements.PIECE_HELD_SCALE, {
      duration: PIECE_RETURN_TO_WELL_CENTER_MS,
    }),
    withTiming(
      GameElements.PIECE_WELL_SCALE,
      { duration: PIECE_RETURN_TO_WELL_LOWER_MS },
      (finished) => {
        if (!finished) return;
        anim.zIndex.value = GameElements.PIECE_WELL_ZINDEX;
      },
    ),
  );
  anim.scaleY.value = withSequence(
    withTiming(GameElements.PIECE_HELD_SCALE, {
      duration: PIECE_RETURN_TO_WELL_CENTER_MS,
    }),
    withTiming(GameElements.PIECE_WELL_SCALE, {
      duration: PIECE_RETURN_TO_WELL_LOWER_MS,
    }),
  );
}
