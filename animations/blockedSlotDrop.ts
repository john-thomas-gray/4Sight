import { GameElements } from "@/constants";
import { Direction } from "@/engine";
import type { PieceAnimation } from "@/types/animation";
import type { CellLayout } from "@/types/board";
import { Easing, withDelay, withSequence, withTiming } from "react-native-reanimated";

export const SLIDE_TO_BLOCKED_SLOT_MS = 120;
/** Bump segment timings aligned with legacy `_v0` choreography (without glide to well). */
export const BLOCKED_BUMP_PHASE_MS = 1300;

/** When to start the standard return-to-well move after drop end. */
export const BLOCKED_DROP_RETURN_START_MS =
  SLIDE_TO_BLOCKED_SLOT_MS + BLOCKED_BUMP_PHASE_MS * 0.53;

function centerOfCell(layout: CellLayout) {
  return {
    x: layout.pageX + layout.width / 2 - GameElements.PIECE_RADIUS,
    y: layout.pageY + layout.height / 2 - GameElements.PIECE_RADIUS,
  };
}

function blockedPieceBounceOffsets(
  direction: Direction,
): { ox: number; oy: number } {
  switch (direction) {
    case Direction.Left:
      return { ox: -10, oy: 0 };
    case Direction.Right:
      return { ox: 10, oy: 0 };
    case Direction.Up:
      return { ox: 0, oy: -10 };
    case Direction.Down:
      return { ox: 0, oy: 10 };
  }
}

function blockingPieceBounceOffsets(
  direction: Direction,
): { ox: number; oy: number } {
  switch (direction) {
    case Direction.Left:
      return { ox: -4, oy: 0 };
    case Direction.Right:
      return { ox: 4, oy: 0 };
    case Direction.Up:
      return { ox: 0, oy: -4 };
    case Direction.Down:
      return { ox: 0, oy: 4 };
  }
}

function elevateTowardBoardSlot(anim: PieceAnimation): void {
  anim.scaleX.value = withTiming(GameElements.PIECE_BOARD_SCALE, { duration: 110 });
  anim.scaleY.value = withTiming(GameElements.PIECE_BOARD_SCALE, { duration: 110 });
  anim.zIndex.value = withTiming(900, { duration: 180 });
}

/**
 * Slide into the slot, bump against the blocker, then rest at the slot center.
 * After {@link BLOCKED_DROP_RETURN_START_MS}, run the same return-to-well
 * animation as a normal rejected drop.
 */
export function animateDroppedPieceBlockedInSlot(
  anim: PieceAnimation,
  slotLayout: CellLayout,
  entryDirection: Direction,
): void {
  const T = BLOCKED_BUMP_PHASE_MS;
  const slide = SLIDE_TO_BLOCKED_SLOT_MS;
  const { x: slotX, y: slotY } = centerOfCell(slotLayout);
  const { ox: bx, oy: by } = blockedPieceBounceOffsets(entryDirection);

  elevateTowardBoardSlot(anim);

  anim.translateX.value = withSequence(
    withTiming(slotX, { duration: slide, easing: Easing.inOut(Easing.quad) }),
    withTiming(slotX + bx, { duration: T * 0.15 }),
    withTiming(
      slotX,
      { duration: T * 0.15 },
      () => {
        "worklet";
        anim.scaleX.value = GameElements.PIECE_HELD_SCALE;
        anim.scaleY.value = GameElements.PIECE_HELD_SCALE;
        anim.zIndex.value = GameElements.PIECE_HELD_ZINDEX;
      },
    ),
  );
  anim.translateY.value = withSequence(
    withTiming(slotY, { duration: slide, easing: Easing.inOut(Easing.quad) }),
    withTiming(slotY + by, { duration: T * 0.15 }),
    withTiming(slotY, { duration: T * 0.15 }),
  );
}

export function animateBlockingPieceBump(
  blockerAnim: PieceAnimation,
  blockedSpaceLayout: CellLayout,
  entryDirection: Direction,
): void {
  const T = BLOCKED_BUMP_PHASE_MS;
  const slide = SLIDE_TO_BLOCKED_SLOT_MS;
  const cx = centerOfCell(blockedSpaceLayout).x;
  const cy = centerOfCell(blockedSpaceLayout).y;
  const { ox: bounceX, oy: bounceY } = blockingPieceBounceOffsets(entryDirection);

  blockerAnim.translateX.value = withDelay(
    slide + T * 0.15,
    withSequence(
      withTiming(cx + bounceX, { duration: T * 0.15 }),
      withTiming(cx, { duration: T * 0.15 }),
    ),
  );
  blockerAnim.translateY.value = withDelay(
    slide + T * 0.15,
    withSequence(
      withTiming(cy + bounceY, { duration: T * 0.15 }),
      withTiming(cy, { duration: T * 0.15 }),
    ),
  );
}
