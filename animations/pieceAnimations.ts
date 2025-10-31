import { Animations, GameElements } from "@/constants";
import {
  BOARD_SCALE_DURATION,
  HELD_SCALE_DURATION,
  HELD_ZINDEX_DELAY,
  PIECE_TO_SLOT,
  RESET_PIECE_DELAY,
  WELL_SCALE_DURATION,
  WELL_ZINDEX_DELAY,
  WINNER_V0,
  WINNER_V1,
} from "@/constants/animations";
import {
  PIECE_BOARD_ZINDEX,
  PIECE_HELD_ZINDEX,
  PIECE_WELL_ZINDEX,
} from "@/constants/gameElements";
import { Board } from "@/types";
import type { PieceAnimation } from "@/types/animation";
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

const blockedPieceReturnTimeouts = new Map<
  SharedValue<number>,
  ReturnType<typeof setTimeout>
>();

const resetPieceTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

export const setPieceScale = ({
  scaleX,
  scaleY,
  zIndex,
  location,
}: {
  scaleX: SharedValue<number>;
  scaleY: SharedValue<number>;
  zIndex: SharedValue<number>;
  location: "well" | "board" | "held";
}) => {
  "worklet";

  const scaleMap = {
    well: GameElements.PIECE_WELL_SCALE,
    board: GameElements.PIECE_BOARD_SCALE,
    held: GameElements.PIECE_HELD_SCALE,
  };

  const zIndexMap = {
    well: PIECE_WELL_ZINDEX,
    board: PIECE_BOARD_ZINDEX,
    held: PIECE_HELD_ZINDEX,
  };

  const scaleDurationMap = {
    well: WELL_SCALE_DURATION,
    board: BOARD_SCALE_DURATION,
    held: HELD_SCALE_DURATION,
  };

  scaleX.value = withTiming(scaleMap[location as keyof typeof scaleMap], {
    duration: scaleDurationMap[location as keyof typeof scaleDurationMap],
  });
  scaleY.value = withTiming(scaleMap[location as keyof typeof scaleMap], {
    duration: scaleDurationMap[location as keyof typeof scaleDurationMap],
  });
  zIndex.value = zIndexMap[location as keyof typeof zIndexMap];
};

export const animateZIndexPiece = ({
  zIndex,
  delay,
  location,
}: {
  zIndex: SharedValue<number>;
  delay: number;
  location: "well" | "board" | "held";
}) => {
  "worklet";

  const zIndexMap = {
    well: PIECE_WELL_ZINDEX,
    board: PIECE_BOARD_ZINDEX,
    held: PIECE_HELD_ZINDEX,
  };

  zIndex.value = withDelay(
    delay,
    withTiming(zIndexMap[location as keyof typeof zIndexMap], {
      duration: 0,
    })
  );
};

export const animateScalePiece = ({
  scaleX,
  scaleY,
  location,
}: {
  scaleX: SharedValue<number>;
  scaleY: SharedValue<number>;
  location: "well" | "board" | "held";
}) => {
  "worklet";

  const scaleMap = {
    well: GameElements.PIECE_WELL_SCALE,
    board: GameElements.PIECE_BOARD_SCALE,
    held: GameElements.PIECE_HELD_SCALE,
  };

  const scaleDurationMap = {
    well: WELL_SCALE_DURATION,
    board: BOARD_SCALE_DURATION,
    held: HELD_SCALE_DURATION,
  };

  scaleX.value = withTiming(scaleMap[location as keyof typeof scaleMap], {
    duration: scaleDurationMap[location as keyof typeof scaleDurationMap],
  });
  scaleY.value = withTiming(scaleMap[location as keyof typeof scaleMap], {
    duration: scaleDurationMap[location as keyof typeof scaleDurationMap],
  });
};

export const elevationPieceToSlot = ({
  scaleX,
  scaleY,
  zIndex,
}: {
  scaleX: SharedValue<number>;
  scaleY: SharedValue<number>;
  zIndex: SharedValue<number>;
}) => {
  "worklet";

  animateScalePiece({ scaleX, scaleY, location: "board" });
  animateZIndexPiece({
    zIndex,
    location: "board",
    delay: BOARD_SCALE_DURATION,
  });
};

export const elevationPieceToWell = ({
  scaleX,
  scaleY,
  zIndex,
}: {
  scaleX: SharedValue<number>;
  scaleY: SharedValue<number>;
  zIndex: SharedValue<number>;
}) => {
  "worklet";

  animateScalePiece({ scaleX, scaleY, location: "well" });
  animateZIndexPiece({
    zIndex,
    location: "well",
    delay: WELL_ZINDEX_DELAY,
  });
};

export const elevationPieceToHeld = ({
  scaleX,
  scaleY,
  zIndex,
}: {
  scaleX: SharedValue<number>;
  scaleY: SharedValue<number>;
  zIndex: SharedValue<number>;
}) => {
  "worklet";

  animateScalePiece({ scaleX, scaleY, location: "held" });
  animateZIndexPiece({
    zIndex,
    location: "held",
    delay: HELD_ZINDEX_DELAY,
  });
};

export const animatePieceToWell = ({
  translateX,
  translateY,
  selectedCell,
  scaleX,
  scaleY,
  zIndex,
}: {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  selectedCell: EachCellType;
  scaleX: SharedValue<number>;
  scaleY: SharedValue<number>;
  zIndex: SharedValue<number>;
}) => {
  "worklet";
  elevationPieceToWell({ scaleX, scaleY, zIndex });
  translateX.value = withTiming(
    selectedCell.layout!.pageX +
      selectedCell.layout!.width / 2 -
      GameElements.PIECE_RADIUS,
    {
      duration: Animations.RETURN_TO_WELL,
      easing: Easing.inOut(Easing.quad),
    }
  );
  translateY.value = withTiming(
    selectedCell.layout!.pageY +
      selectedCell.layout!.height / 2 -
      GameElements.PIECE_RADIUS,
    {
      duration: Animations.RETURN_TO_WELL,
      easing: Easing.inOut(Easing.quad),
    }
  );
};

export const animateBlockedPiece = ({
  translateX,
  translateY,
  slotLayout,
  scaleX,
  scaleY,
  zIndex,
  currentWellLayout,
  direction,
}: {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  slotLayout: CellLayout;
  scaleX: SharedValue<number>;
  scaleY: SharedValue<number>;
  zIndex: SharedValue<number>;
  currentWellLayout: Board.CellLayout;
  direction: Direction;
}) => {
  "worklet";
  const totalTime = 1300;

  const slot = slotLayout;
  const slotCenterX = slot.pageX + slot.width / 2 - GameElements.PIECE_RADIUS;
  const slotCenterY = slot.pageY + slot.height / 2 - GameElements.PIECE_RADIUS;

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
  elevationPieceToSlot({ scaleX, scaleY, zIndex });
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
        elevationPieceToHeld({ scaleX, scaleY, zIndex });
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
  const existingTimeout = blockedPieceReturnTimeouts.get(translateX);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }
  const timeoutId = setTimeout(() => {
    blockedPieceReturnTimeouts.delete(translateX);
    elevationPieceToWell({ scaleX, scaleY, zIndex });
  }, totalTime * 0.76);
  blockedPieceReturnTimeouts.set(translateX, timeoutId);
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

export const animateMisplacedPiece = ({
  translateY,
  translateX,
  currentWellLayout,
  scaleX,
  scaleY,
  zIndex,
}: {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  currentWellLayout: Board.CellLayout;
  scaleX: SharedValue<number>;
  scaleY: SharedValue<number>;
  zIndex: SharedValue<number>;
}) => {
  "worklet";
  const well = currentWellLayout;
  if (!well) return;

  elevationPieceToHeld({ scaleX, scaleY, zIndex });
  translateX.value = withTiming(
    well.pageX + well.width / 2 - GameElements.PIECE_RADIUS,
    {
      duration: Animations.RETURN_TO_WELL,
      easing: Easing.inOut(Easing.quad),
    },
    () => {
      elevationPieceToWell({ scaleX, scaleY, zIndex });
    }
  );
  translateY.value = withTiming(
    well.pageY + well.height / 2 - GameElements.PIECE_RADIUS,
    {
      duration: Animations.RETURN_TO_WELL,
      easing: Easing.inOut(Easing.quad),
    }
  );
};
export const animateResetPiece = ({
  translateY,
  translateX,
  currentWellLayout,
  scaleX,
  scaleY,
  zIndex,
}: {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  currentWellLayout: Board.CellLayout;
  scaleX: SharedValue<number>;
  scaleY: SharedValue<number>;
  zIndex: SharedValue<number>;
}) => {
  "worklet";
  const well = currentWellLayout;
  if (!well) return;

  elevationPieceToHeld({ scaleX, scaleY, zIndex });
  translateX.value = withTiming(
    well.pageX + well.width / 2 - GameElements.PIECE_RADIUS,
    {
      duration: Animations.RESET_PIECE_DURATION,
      easing: Easing.inOut(Easing.quad),
    },
    () => {
      elevationPieceToWell({ scaleX, scaleY, zIndex });
    }
  );
  translateY.value = withTiming(
    well.pageY + well.height / 2 - GameElements.PIECE_RADIUS,
    {
      duration: Animations.RESET_PIECE_DURATION,
      easing: Easing.inOut(Easing.quad),
    }
  );
};

export const resetAllPieces = ({
  boardPieceLocations,
  wellPieceLocations,
  wells,
  pieces,
  pieceAnimations,
}: {
  boardPieceLocations: Record<string, string>;
  wellPieceLocations: Record<string, string>;
  wells: Record<Team, Record<string, CellLayout>>;
  pieces: Record<string, PieceProps>;
  pieceAnimations: Record<string, PieceAnimation>;
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

    cancelAnimation(anim.scaleX);
    cancelAnimation(anim.scaleY);

    elevationPieceToHeld({
      scaleX: anim.scaleX,
      scaleY: anim.scaleY,
      zIndex: anim.zIndex,
    });
    const existingTimeout = resetPieceTimeouts.get(pieceId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    const timeoutId = setTimeout(() => {
      resetPieceTimeouts.delete(pieceId);
      animateResetPiece({
        translateX: anim.translateX,
        translateY: anim.translateY,
        currentWellLayout: targetLayout,
        scaleX: anim.scaleX,
        scaleY: anim.scaleY,
        zIndex: anim.zIndex,
      });
    }, RESET_PIECE_DELAY);
    resetPieceTimeouts.set(pieceId, timeoutId);
    assignedThisReset.add(targetWellId);
  });
};

export function animateWinner({
  translateX,
  translateY,
  scaleX,
  scaleY,
  color,
  winnerColor,
}: {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  scaleX: SharedValue<number>;
  scaleY: SharedValue<number>;
  color: SharedValue<string>;
  winnerColor: SharedValue<string>;
}) {
  "worklet";

  // reserved for future skew/rotation winner effects if desired
  type Point = { x: number; y: number };
  type Animation = {
    svx: SharedValue<number>;
    svy: SharedValue<number>;
    v0: Point;
    v1: Point;
  };

  const trans = {
    0: { x: translateX.value, y: translateY.value },
    1: { x: translateX.value - 5, y: translateY.value - 15 },
  };

  const scale = {
    0: { x: scaleX.value, y: scaleY.value },
    1: { x: scaleX.value * 1.3, y: scaleY.value * 1.3 },
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

export const successfulPieceDrop = ({
  translateX,
  translateY,
  slotLayout,
  spaceLayout,
  scaleX,
  scaleY,
  zIndex,
}: {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  slotLayout: CellLayout;
  spaceLayout: CellLayout;
  scaleX: SharedValue<number>;
  scaleY: SharedValue<number>;
  zIndex: SharedValue<number>;
}) => {
  "worklet";
  elevationPieceToSlot({ scaleX, scaleY, zIndex });
  translateX.value = withSequence(
    withTiming(
      slotLayout.pageX + slotLayout.width / 2 - GameElements.PIECE_RADIUS,
      {
        duration: PIECE_TO_SLOT,
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
        duration: Animations.PIECE_TO_SLOT,
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
