import { GameElements } from "@/constants";
import { PieceStatus, useGameSession } from "@/context/GameSessionContext";
import { useLayout } from "@/context/LayoutContext";
import { useSettings } from "@/context/SettingsContext";
import { useUi } from "@/context/UiContext";
import { Team } from "@/engine";
import type { PieceAnimation } from "@/types/animation";
import { CellLayout, CellType, EachCellType } from "@/types/board";
import React, { memo, useEffect, useMemo } from "react";
import { ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import Glow from "./Glow";
import { resolveDropTarget } from "./pieceDropController";

type PieceViewProps = {
  id: string;
  team: Team;
};

const PIECE_TO_SLOT = 150;
const SLOT_TO_SPACE = 700;
const RETURN_TO_WELL = 300;

function centerOf(layout: CellLayout) {
  return {
    x: layout.pageX + layout.width / 2 - GameElements.PIECE_RADIUS,
    y: layout.pageY + layout.height / 2 - GameElements.PIECE_RADIUS,
  };
}

const PieceView: React.FC<PieceViewProps> = ({ id, team }) => {
  const {
    gameState,
    pieceAnims,
    pieceStatusMap,
    setPieceStatusMap,
    wellPieceLocations,
    setWellPieceLocations,
    dropPiece,
  } = useGameSession();
  const layout = useLayout();
  const { theme } = useSettings();
  const { moveInProgress, setMoveInProgress, setMoveInProgressDelayed } =
    useUi();

  const animate = pieceAnims[id];
  const status = pieceStatusMap[id] ?? PieceStatus.inWell;

  // Sync piece colors with theme
  useEffect(() => {
    if (!animate) return;
    const isTeamOne = team === Team.One;
    animate.color.value = isTeamOne
      ? theme.colorTheme.TEAM_ONE_COLOR
      : theme.colorTheme.TEAM_TWO_COLOR;
    animate.winnerColor.value = isTeamOne
      ? theme.colorTheme.TEAM_ONE_WINNER_COLOR
      : theme.colorTheme.TEAM_TWO_WINNER_COLOR;
  }, [animate, team, theme]);

  const isMyTurn = useMemo(() => {
    const piece = gameState.pieces[id];
    return piece && piece.team === gameState.currentTeam;
  }, [gameState.currentTeam, gameState.pieces, id]);

  const currentWellEntry = useMemo(() => {
    const entry = Object.entries(wellPieceLocations).find(
      ([, pid]) => pid === id
    );
    return entry ? entry[0] : null;
  }, [wellPieceLocations, id]);

  const currentWellLayout = useMemo(() => {
    if (!currentWellEntry) return null;
    return (
      layout.wells[Team.One]?.[currentWellEntry] ??
      layout.wells[Team.Two]?.[currentWellEntry] ??
      null
    );
  }, [currentWellEntry, layout.wells]);

  const allCells = useMemo((): EachCellType[] => {
    const slots = Object.entries(layout.slots).map(([cid, l]) => ({
      id: cid,
      layout: l,
      type: CellType.Slot as const,
    }));
    const spaces = Object.entries(layout.spaces).map(([cid, l]) => ({
      id: cid,
      layout: l,
      type: CellType.Space as const,
    }));
    const wells = Object.entries(layout.wells[team] ?? {}).map(([cid, l]) => ({
      id: cid,
      layout: l,
      type: CellType.Well as const,
      team,
    }));
    return [...slots, ...spaces, ...wells];
  }, [layout.slots, layout.spaces, layout.wells, team]);

  const updateStatus = (s: PieceStatus) => {
    setPieceStatusMap((prev) => ({ ...prev, [id]: s }));
  };

  const deleteFromWell = () => {
    if (!currentWellEntry) return;
    setWellPieceLocations((prev) => {
      const next = { ...prev };
      delete next[currentWellEntry];
      return next;
    });
  };

  const returnToWell = (wellId: string) => {
    setWellPieceLocations((prev) => ({ ...prev, [wellId]: id }));
  };

  const animateToWell = (wellLayout: CellLayout, anim: PieceAnimation) => {
    "worklet";
    const c = centerOf(wellLayout);
    anim.scaleX.value = withTiming(GameElements.PIECE_WELL_SCALE, {
      duration: 500,
    });
    anim.scaleY.value = withTiming(GameElements.PIECE_WELL_SCALE, {
      duration: 500,
    });
    anim.translateX.value = withTiming(c.x, {
      duration: RETURN_TO_WELL,
      easing: Easing.inOut(Easing.quad),
    });
    anim.translateY.value = withTiming(c.y, {
      duration: RETURN_TO_WELL,
      easing: Easing.inOut(Easing.quad),
    });
    anim.zIndex.value = GameElements.PIECE_WELL_ZINDEX;
  };

  const animateSlotDrop = (
    slotLayout: CellLayout,
    spaceLayout: CellLayout,
    anim: PieceAnimation
  ) => {
    "worklet";
    const slotC = centerOf(slotLayout);
    const spaceC = centerOf(spaceLayout);
    anim.scaleX.value = withTiming(GameElements.PIECE_BOARD_SCALE, {
      duration: 200,
    });
    anim.scaleY.value = withTiming(GameElements.PIECE_BOARD_SCALE, {
      duration: 200,
    });
    anim.zIndex.value = GameElements.PIECE_BOARD_ZINDEX;
    anim.translateX.value = withSequence(
      withTiming(slotC.x, {
        duration: PIECE_TO_SLOT,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(spaceC.x, { duration: SLOT_TO_SPACE, easing: Easing.bounce })
    );
    anim.translateY.value = withSequence(
      withTiming(slotC.y, {
        duration: PIECE_TO_SLOT,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(spaceC.y, { duration: SLOT_TO_SPACE, easing: Easing.bounce })
    );
  };

  const movePiece = useMemo(
    () =>
      Gesture.Pan()
        .enabled(
          status !== PieceStatus.onBoard &&
            status !== PieceStatus.winner &&
            gameState.status === "playing" &&
            isMyTurn &&
            (status === PieceStatus.isHeld || !moveInProgress)
        )
        .hitSlop({ left: 24, right: 24, top: 24, bottom: 24 })
        .onStart(() => {
          animate.scaleX.value = withTiming(GameElements.PIECE_HELD_SCALE, {
            duration: 100,
          });
          animate.scaleY.value = withTiming(GameElements.PIECE_HELD_SCALE, {
            duration: 100,
          });
          animate.zIndex.value = GameElements.PIECE_HELD_ZINDEX;
          scheduleOnRN(deleteFromWell);
          scheduleOnRN(updateStatus, PieceStatus.isHeld);
          scheduleOnRN(setMoveInProgress, true);
        })
        .onUpdate((event) => {
          animate.translateX.value =
            event.absoluteX - GameElements.PIECE_RADIUS;
          animate.translateY.value =
            event.absoluteY - GameElements.PIECE_RADIUS - 50;
        })
        .onEnd(() => {
          const pieceCenter = {
            x: animate.translateX.value + GameElements.PIECE_RADIUS,
            y: animate.translateY.value + GameElements.PIECE_RADIUS,
          };

          for (const cell of allCells) {
            if (!cell.layout) continue;
            const { pageX, pageY, width, height } = cell.layout;
            const inBounds =
              pieceCenter.x >= pageX &&
              pieceCenter.x <= pageX + width &&
              pieceCenter.y >= pageY &&
              pieceCenter.y <= pageY + height;
            if (!inBounds) continue;

            const target = resolveDropTarget(
              cell.id,
              gameState.board,
              layout.slots,
              layout.spaces,
              layout.wells[team]
            );

            if (target.kind === "slot") {
              const slotLayout = layout.slots[cell.id];
              const spaceLayout = layout.spaces[target.landingKey];
              if (slotLayout && spaceLayout) {
                animateSlotDrop(slotLayout, spaceLayout, animate);
                scheduleOnRN(dropPiece, target.slotCoord, id);
                scheduleOnRN(updateStatus, PieceStatus.onBoard);
                scheduleOnRN(setMoveInProgressDelayed, false, 400);
                return;
              }
            }

            if (target.kind === "well") {
              if (wellPieceLocations[target.wellId] === undefined) {
                const wellLayout = layout.wells[team]?.[target.wellId];
                if (wellLayout) {
                  animateToWell(wellLayout, animate);
                  scheduleOnRN(returnToWell, target.wellId);
                  scheduleOnRN(updateStatus, PieceStatus.inWell);
                  scheduleOnRN(setMoveInProgressDelayed, false, 300);
                  return;
                }
              }
            }

            // Dropped on occupied space or blocked slot — return to well
            if (currentWellLayout) {
              animateToWell(currentWellLayout, animate);
            }
            if (currentWellEntry) scheduleOnRN(returnToWell, currentWellEntry);
            scheduleOnRN(updateStatus, PieceStatus.inWell);
            scheduleOnRN(setMoveInProgressDelayed, false, 300);
            return;
          }

          // Missed all cells — return to well
          if (currentWellLayout) {
            animateToWell(currentWellLayout, animate);
          }
          if (currentWellEntry) scheduleOnRN(returnToWell, currentWellEntry);
          scheduleOnRN(updateStatus, PieceStatus.inWell);
          scheduleOnRN(setMoveInProgressDelayed, false, 300);
        }),
    [
      status,
      gameState.status,
      gameState.board,
      isMyTurn,
      moveInProgress,
      animate,
      allCells,
      layout.slots,
      layout.spaces,
      layout.wells,
      team,
      wellPieceLocations,
      currentWellLayout,
      currentWellEntry,
      id,
      dropPiece,
      setMoveInProgress,
      setMoveInProgressDelayed,
    ]
  );

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [
      { translateX: animate.translateX.value },
      { translateY: animate.translateY.value },
      { scaleX: animate.scaleX.value },
      { scaleY: animate.scaleY.value },
    ],
    zIndex: animate.zIndex.value,
    backgroundColor: animate.color.value,
  }));

  const baseStyle: ViewStyle = {
    height: GameElements.PIECE_SIZE,
    width: GameElements.PIECE_SIZE,
    borderRadius: GameElements.PIECE_RADIUS,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 0,
    left: 0,
  };

  return (
    <GestureDetector gesture={movePiece}>
      <Animated.View
        pointerEvents={status === PieceStatus.onBoard ? "none" : "auto"}
        style={[
          baseStyle,
          animatedStyles,
          status === PieceStatus.inWell
            ? { zIndex: GameElements.PIECE_WELL_ZINDEX }
            : null,
        ]}
      >
        <Glow pieceId={id} />
        <Animated.View
          style={{
            position: "absolute",
            top: GameElements.PIECE_SIZE * 0.2,
            right: GameElements.PIECE_SIZE * 0.1,
            width: GameElements.PIECE_SIZE * 0.4,
            height: GameElements.PIECE_SIZE * 0.2,
            borderRadius: GameElements.PIECE_RADIUS,
            backgroundColor: "rgba(200, 200, 200, 0.6)",
            transform: [{ rotate: "40deg" }],
            zIndex: 1,
          }}
        />
      </Animated.View>
    </GestureDetector>
  );
};

export default memo(PieceView);
