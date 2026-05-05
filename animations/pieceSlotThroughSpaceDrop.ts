import { GameElements } from "@/constants";
import type { PieceAnimation } from "@/types/animation";
import type { CellLayout } from "@/types/board";
import {
  Easing,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export const SLOT_CENTER_MS = 120;
export const SLOT_LOWER_IN_SLOT_MS = 110;

type PieceSlotThroughSpaceDropOptions = {
  /**
   * When true, snaps scale and z-index to the "held" presentation before the
   * slot→space move (e.g. scripted scenario playback). Interactive drags are
   * usually already in that state.
   */
  ensureHeldPresentation?: boolean;
};

/**
 * Choreography: slot center → lower in place → landing space, with
 * axis-dependent easing. Scale only changes after the piece is centered.
 */
export function animatePieceSlotThroughSpaceDrop(
  anim: PieceAnimation,
  slotLayout: CellLayout,
  spaceLayout: CellLayout,
  options?: PieceSlotThroughSpaceDropOptions,
): void {
  const slotX =
    slotLayout.pageX + slotLayout.width / 2 - GameElements.PIECE_RADIUS;
  const slotY =
    slotLayout.pageY + slotLayout.height / 2 - GameElements.PIECE_RADIUS;
  const landingX =
    spaceLayout.pageX + spaceLayout.width / 2 - GameElements.PIECE_RADIUS;
  const landingY =
    spaceLayout.pageY + spaceLayout.height / 2 - GameElements.PIECE_RADIUS;
  const isVerticalDrop =
    Math.abs(landingY - slotY) >= Math.abs(landingX - slotX);

  if (options?.ensureHeldPresentation) {
    anim.scaleX.value = GameElements.PIECE_HELD_SCALE;
    anim.scaleY.value = GameElements.PIECE_HELD_SCALE;
    anim.zIndex.value = GameElements.PIECE_HELD_ZINDEX;
  }

  anim.translateX.value = withSequence(
    withTiming(slotX, { duration: SLOT_CENTER_MS }),
    withDelay(
      SLOT_LOWER_IN_SLOT_MS,
      withTiming(landingX, {
        duration: isVerticalDrop ? 320 : 700,
        easing: isVerticalDrop ? Easing.linear : Easing.bounce,
      }),
    ),
  );
  anim.translateY.value = withSequence(
    withTiming(slotY, { duration: SLOT_CENTER_MS }),
    withDelay(
      SLOT_LOWER_IN_SLOT_MS,
      withTiming(landingY, {
        duration: isVerticalDrop ? 700 : 320,
        easing: isVerticalDrop ? Easing.bounce : Easing.linear,
      }),
    ),
  );
  anim.scaleX.value = withDelay(
    SLOT_CENTER_MS,
    withTiming(GameElements.PIECE_BOARD_SCALE, {
      duration: SLOT_LOWER_IN_SLOT_MS,
    }),
  );
  anim.scaleY.value = withDelay(
    SLOT_CENTER_MS,
    withTiming(GameElements.PIECE_BOARD_SCALE, {
      duration: SLOT_LOWER_IN_SLOT_MS,
    }),
  );
  anim.zIndex.value = GameElements.PIECE_BOARD_ZINDEX;
}
