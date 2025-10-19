import { Animations, GameElements } from "@/constants";
import { SLOT_INSERT, WINNER_V0, WINNER_V1 } from "@/constants/animations";
import { PIECE_WELL_SCALE } from "@/constants/gameElements";
import type { PieceAnimation } from "@/hooks/usePieceAnimations";
import { Board } from "@/types";
import { CellLayout, Direction, EachCellType, Team } from "@/types/board";
import type { PieceProps } from "@/types/logic";
import {
  cancelAnimation,
  Easing,
  SharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type AnimateWinner = {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  scaleX: SharedValue<number>;
  scaleY: SharedValue<number>;
  skewX: SharedValue<number>;
  skewY: SharedValue<number>;
  rotation: SharedValue<number>;
  shadowOpacity?: SharedValue<number>;
  shadowRadius?: SharedValue<number>;
  shadowOffset?: SharedValue<number>;
  color: SharedValue<string>;
  winnerColor: SharedValue<string>;
};

export function animateWinner({
  translateX,
  translateY,
  scaleX,
  scaleY,
  skewX,
  skewY,
  rotation,
  color,
  winnerColor,
}: // shadowOpacity,
// shadowRadius,
// shadowOffset,
AnimateWinner) {
  "worklet";
  const trans = {
    0: { x: translateX.value, y: translateY.value },
    1: { x: translateX.value - 5, y: translateY.value - 15 },
  };

  const scale = {
    0: { x: scaleX.value, y: scaleY.value },
    1: { x: scaleX.value * 1.3, y: scaleY.value * 1.3 },
  };

  // reserved for future skew/rotation winner effects if desired
  type Point = { x: number; y: number };
  type Animation = {
    svx: SharedValue<number>;
    svy: SharedValue<number>;
    v0: Point;
    v1: Point;
  };

  const animation = ({ svx, svy, v0, v1 }: Animation) => {
    svx.value = withSequence(
      withTiming(v1.x, {
        duration: WINNER_V1,
        easing: Easing.inOut(Easing.exp),
      }),

      withTiming(v0.x, {
        duration: WINNER_V0,
        easing: Easing.bounce,
      })
    );
    svy.value = withSequence(
      withTiming(v1.y, {
        duration: WINNER_V1,
        easing: Easing.inOut(Easing.exp),
      }),

      withTiming(v0.y, {
        duration: WINNER_V0,
        easing: Easing.bounce,
      })
    );
  };

  animation({ svx: translateX, svy: translateY, v0: trans[0], v1: trans[1] });
  animation({ svx: scaleX, svy: scaleY, v0: scale[0], v1: scale[1] });

  color.value = withTiming(winnerColor.value, {
    duration: WINNER_V1,
    easing: Easing.inOut(Easing.exp),
  });

  scaleX.value = withDelay(
    WINNER_V1 + WINNER_V0,
    withRepeat(
      withSequence(
        withTiming(1.15, {
          duration: 1500,
        }),
        withTiming(1, {
          duration: 1500,
        })
      ),
      -1
    )
  );
  scaleY.value = withDelay(
    WINNER_V1 + WINNER_V0,
    withRepeat(
      withSequence(
        withTiming(1.15, {
          duration: 1500,
        }),
        withTiming(1, {
          duration: 1500,
        })
      ),
      -1
    )
  );
}

type AnimateMisplacedPieceProps = {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  currentWellLayout: Board.CellLayout;
};

export const animateMisplacedPiece = ({
  translateY,
  translateX,
  currentWellLayout,
}: AnimateMisplacedPieceProps) => {
  "worklet";
  const well = currentWellLayout;
  if (!well) return;
  translateX.value = withTiming(
    well.pageX + well.width / 2 - GameElements.PIECE_RADIUS,
    {
      duration: Animations.WELL_RETURN,
      easing: Easing.inOut(Easing.quad),
    }
  );
  translateY.value = withTiming(
    well.pageY + well.height / 2 - GameElements.PIECE_RADIUS,
    {
      duration: Animations.WELL_RETURN,
      easing: Easing.inOut(Easing.quad),
    }
  );
};

type AnimateToSelectedCellProps = {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  selectedCell: EachCellType;
};

export const animateToSelectedCell = ({
  translateX,
  translateY,
  selectedCell,
}: AnimateToSelectedCellProps) => {
  "worklet";
  translateX.value = withTiming(
    selectedCell.layout!.pageX +
      selectedCell.layout!.width / 2 -
      GameElements.PIECE_RADIUS,
    {
      duration: Animations.WELL_RETURN,
      easing: Easing.inOut(Easing.quad),
    }
  );
  translateY.value = withTiming(
    selectedCell.layout!.pageY +
      selectedCell.layout!.height / 2 -
      GameElements.PIECE_RADIUS,
    {
      duration: Animations.WELL_RETURN,
      easing: Easing.inOut(Easing.quad),
    }
  );
};

export const animatePieceDrop = ({
  translateX,
  translateY,
  slotLayout,
  spaceLayout,
}: {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  slotLayout: CellLayout;
  spaceLayout: CellLayout;
}) => {
  "worklet";
  translateX.value = withSequence(
    withTiming(
      slotLayout.pageX + slotLayout.width / 2 - GameElements.PIECE_RADIUS,
      {
        duration: SLOT_INSERT,
        easing: Easing.inOut(Easing.quad),
      }
    ),

    withTiming(
      spaceLayout.pageX + spaceLayout.width / 2 - GameElements.PIECE_RADIUS,
      {
        duration: Animations.SLOT_TO_SPACE,
        easing: Easing.bounce,
      }
    )
  );

  translateY.value = withSequence(
    withTiming(
      slotLayout.pageY + slotLayout.height / 2 - GameElements.PIECE_RADIUS,
      {
        duration: Animations.SLOT_INSERT,
        easing: Easing.inOut(Easing.quad),
      }
    ),

    withTiming(
      spaceLayout.pageY + spaceLayout.height / 2 - GameElements.PIECE_RADIUS,
      {
        duration: Animations.SLOT_TO_SPACE,
        easing: Easing.bounce,
      }
    )
  );
};

export const animatePieceReset = ({
  boardPieceLocations,
  wellPieceLocations,
  wells,
  pieces,
  pieceAnimations,
  duration = 500,
}: {
  boardPieceLocations: Record<string, string>;
  wellPieceLocations: Record<string, string>;
  wells: Record<Team, Record<string, CellLayout>>;
  pieces: Record<string, PieceProps>;
  pieceAnimations: Record<string, PieceAnimation>;
  duration?: number;
}) => {
  "worklet";
  const boardSnapshot = { ...boardPieceLocations };
  const wellSnapshot = { ...wellPieceLocations };
  const assignedThisReset = new Set<string>();

  Object.values(boardSnapshot).forEach((pieceId) => {
    const piece = pieces[pieceId];
    if (!piece) return;
    const teamWells = wells[piece.team] || {};
    const targetWellId = Object.keys(teamWells).find(
      (wid) => !wellSnapshot[wid] && !assignedThisReset.has(wid)
    );
    if (!targetWellId) return;
    const targetLayout = teamWells[targetWellId];
    const anim = pieceAnimations[pieceId];
    if (!anim || !targetLayout) return;

    // stop any repeating animations (e.g., winner pulse) before resetting to well
    cancelAnimation(anim.scaleX);
    cancelAnimation(anim.scaleY);
    anim.scaleX.value = withTiming(PIECE_WELL_SCALE, { duration });
    anim.scaleY.value = withTiming(PIECE_WELL_SCALE, { duration });

    anim.translateX.value = withTiming(
      targetLayout.pageX + targetLayout.width / 2 - GameElements.PIECE_RADIUS,
      { duration }
    );
    anim.translateY.value = withTiming(
      targetLayout.pageY + targetLayout.height / 2 - GameElements.PIECE_RADIUS,
      { duration }
    );
    assignedThisReset.add(targetWellId);
  });
};

export const animatePiecePickup = ({
  scaleX,
  scaleY,
  zIndex,
}: {
  scaleX: SharedValue<number>;
  scaleY: SharedValue<number>;
  zIndex: SharedValue<number>;
}) => {
  "worklet";
  scaleX.value = withTiming(GameElements.PIECE_HELD_SCALE, { duration: 100 });
  scaleY.value = withTiming(GameElements.PIECE_HELD_SCALE, { duration: 100 });
  zIndex.value = 5000;
};

export const animatePieceRelease = ({
  scaleX,
  scaleY,
  zIndex,
}: {
  scaleX: SharedValue<number>;
  scaleY: SharedValue<number>;
  zIndex: SharedValue<number>;
}) => {
  "worklet";

  scaleX.value = withTiming(GameElements.PIECE_PLACED_SCALE, { duration: 120 });
  scaleY.value = withTiming(GameElements.PIECE_PLACED_SCALE, { duration: 120 });
  zIndex.value = withDelay(100, withTiming(500, { duration: 0 }));
};

export const resetBlockedPieceScale = ({
  scaleX,
  scaleY,
  zIndex,
}: {
  scaleX: SharedValue<number>;
  scaleY: SharedValue<number>;
  zIndex: SharedValue<number>;
}) => {
  "worklet";

  scaleX.value = withTiming(GameElements.PIECE_WELL_SCALE, { duration: 120 });
  scaleY.value = withTiming(GameElements.PIECE_WELL_SCALE, { duration: 120 });
  zIndex.value = withDelay(100, withTiming(5000, { duration: 0 }));
};

export const animateBlockedPiece = ({
  translateX,
  translateY,
  slotLayout,
  currentWellLayout,
  direction,
  scaleX,
  scaleY,
  zIndex,
}: {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  slotLayout: CellLayout;
  currentWellLayout: Board.CellLayout;
  direction: Direction;
  scaleX: SharedValue<number>;
  scaleY: SharedValue<number>;
  zIndex: SharedValue<number>;
}) => {
  "worklet";
  const totalTime = 1300;
  const slotCenterX =
    slotLayout.pageX + slotLayout.width / 2 - GameElements.PIECE_RADIUS;
  const slotCenterY =
    slotLayout.pageY + slotLayout.height / 2 - GameElements.PIECE_RADIUS;
  const well = currentWellLayout;
  const wellCenterX = well.pageX + well.width / 2 - GameElements.PIECE_RADIUS;
  const wellCenterY = well.pageY + well.height / 2 - GameElements.PIECE_RADIUS;

  let bounceOffsetX = 0;
  let bounceOffsetY = 0;

  switch (direction) {
    case Direction.Left:
      bounceOffsetX = -10;
      break;
    case Direction.Right:
      bounceOffsetX = 10;
      break;
    case Direction.Up:
      bounceOffsetY = -10;
      break;
    case Direction.Down:
      bounceOffsetY = 10;
      break;
  }

  translateX.value = withSequence(
    withTiming(slotCenterX, {
      duration: totalTime * 0.23,
      easing: Easing.inOut(Easing.quad),
    }),
    withTiming(slotCenterX + bounceOffsetX, {
      duration: totalTime * 0.15,
    }),
    withTiming(
      slotCenterX,
      {
        duration: totalTime * 0.15,
      },
      () => {
        // When we arrive back at the slot center, reset size/zIndex to well state
        resetBlockedPieceScale({ scaleX, scaleY, zIndex });
      }
    ),
    withDelay(
      totalTime * 0.23,
      withTiming(wellCenterX, {
        duration: totalTime * 0.23,
        easing: Easing.inOut(Easing.quad),
      })
    )
  );
  translateY.value = withSequence(
    withTiming(slotCenterY, {
      duration: totalTime * 0.23,
      easing: Easing.inOut(Easing.quad),
    }),
    withTiming(slotCenterY + bounceOffsetY, {
      duration: totalTime * 0.15,
    }),
    withTiming(slotCenterY, {
      duration: totalTime * 0.15,
    }),
    withDelay(
      totalTime * 0.23,
      withTiming(wellCenterY, {
        duration: totalTime * 0.23,
        easing: Easing.inOut(Easing.quad),
      })
    )
  );
};

export const animateBlockingPiece = ({
  translateX,
  translateY,
  blockedSpaceLayout,
  direction,
}: {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  blockedSpaceLayout: CellLayout;
  direction: Direction;
}) => {
  "worklet";
  const totalTime = 1300;
  const spaceCenterX =
    blockedSpaceLayout.pageX +
    blockedSpaceLayout.width / 2 -
    GameElements.PIECE_RADIUS;
  const spaceCenterY =
    blockedSpaceLayout.pageY +
    blockedSpaceLayout.height / 2 -
    GameElements.PIECE_RADIUS;

  let bounceOffsetX = 0;
  let bounceOffsetY = 0;

  switch (direction) {
    case Direction.Left:
      bounceOffsetX = -4;
      break;
    case Direction.Right:
      bounceOffsetX = 4;
      break;
    case Direction.Up:
      bounceOffsetY = -4;
      break;
    case Direction.Down:
      bounceOffsetY = 4;
      break;
  }

  translateX.value = withDelay(
    totalTime * 0.38,
    withSequence(
      withTiming(spaceCenterX + bounceOffsetX, {
        duration: totalTime * 0.15,
      }),
      withTiming(spaceCenterX, {
        duration: totalTime * 0.15,
      })
    )
  );
  translateY.value = withDelay(
    totalTime * 0.38,
    withSequence(
      withTiming(spaceCenterY + bounceOffsetY, {
        duration: totalTime * 0.15,
      }),
      withTiming(spaceCenterY, {
        duration: totalTime * 0.15,
      })
    )
  );
};
