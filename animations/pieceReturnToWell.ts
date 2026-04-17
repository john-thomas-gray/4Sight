import { GameElements } from "@/constants";
import { RETURN_TO_WELL, type PieceAnimation } from "@/types/animation";
import { Easing, withTiming } from "react-native-reanimated";

/**
 * From a held-style presentation, animate translation to well center and ease
 * scales back to the resting well size (callback when horizontal move finishes).
 */
export function animatePieceReturnToWellResting(
  anim: PieceAnimation,
  targetX: number,
  targetY: number,
): void {
  anim.scaleX.value = GameElements.PIECE_HELD_SCALE;
  anim.scaleY.value = GameElements.PIECE_HELD_SCALE;
  anim.zIndex.value = GameElements.PIECE_HELD_ZINDEX;

  anim.translateX.value = withTiming(
    targetX,
    {
      duration: RETURN_TO_WELL,
      easing: Easing.inOut(Easing.quad),
    },
    (finished) => {
      if (!finished) return;
      anim.scaleX.value = GameElements.PIECE_WELL_SCALE;
      anim.scaleY.value = GameElements.PIECE_WELL_SCALE;
      anim.zIndex.value = GameElements.PIECE_WELL_ZINDEX;
    },
  );
  anim.translateY.value = withTiming(targetY, {
    duration: RETURN_TO_WELL,
    easing: Easing.inOut(Easing.quad),
  });
}
