import { GameElements } from "@/constants";
import { PieceStatus, useGameSession } from "@/context/GameSessionContext";
import { useLayout } from "@/context/LayoutContext";
import { useSettings } from "@/context/SettingsContext";
import { useUi } from "@/context/UiContext";
import { Team } from "@/engine";
import { CellType, EachCellType } from "@/types/board";
import React, { memo, useCallback, useEffect, useMemo } from "react";
import { ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import Glow from "./Glow";
import { resolveDropTarget } from "./pieceDropController";

type PieceViewProps = {
  id: string;
  team: Team;
};

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

  const snapToLayout = useCallback(
    (
      targetPageX: number,
      targetPageY: number,
      targetWidth: number,
      targetHeight: number,
      scale: number
    ) => {
      animate.translateX.value =
        targetPageX + targetWidth / 2 - GameElements.PIECE_RADIUS;
      animate.translateY.value =
        targetPageY + targetHeight / 2 - GameElements.PIECE_RADIUS;
      animate.scaleX.value = scale;
      animate.scaleY.value = scale;
    },
    [animate]
  );

  const movePiece = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .enabled(
          status !== PieceStatus.onBoard &&
            status !== PieceStatus.winner &&
            gameState.status === "playing" &&
            isMyTurn &&
            (status === PieceStatus.isHeld || !moveInProgress)
        )
        .hitSlop({ left: 24, right: 24, top: 24, bottom: 24 })
        .onStart(() => {
          animate.scaleX.value = GameElements.PIECE_HELD_SCALE;
          animate.scaleY.value = GameElements.PIECE_HELD_SCALE;
          animate.zIndex.value = GameElements.PIECE_HELD_ZINDEX;

          if (currentWellEntry) {
            setWellPieceLocations((prev) => {
              const next = { ...prev };
              delete next[currentWellEntry];
              return next;
            });
          }
          setPieceStatusMap((prev) => ({ ...prev, [id]: PieceStatus.isHeld }));
          setMoveInProgress(true);
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
              const spaceLayout = layout.spaces[target.landingKey];
              if (spaceLayout) {
                snapToLayout(
                  spaceLayout.pageX,
                  spaceLayout.pageY,
                  spaceLayout.width,
                  spaceLayout.height,
                  GameElements.PIECE_BOARD_SCALE
                );
                animate.zIndex.value = GameElements.PIECE_BOARD_ZINDEX;
                dropPiece(target.slotCoord, id);
                setPieceStatusMap((prev) => ({
                  ...prev,
                  [id]: PieceStatus.onBoard,
                }));
                setMoveInProgressDelayed(false, 400);
                return;
              }
            }

            if (target.kind === "well") {
              if (wellPieceLocations[target.wellId] === undefined) {
                const wellLayout = layout.wells[team]?.[target.wellId];
                if (wellLayout) {
                  snapToLayout(
                    wellLayout.pageX,
                    wellLayout.pageY,
                    wellLayout.width,
                    wellLayout.height,
                    GameElements.PIECE_WELL_SCALE
                  );
                  animate.zIndex.value = GameElements.PIECE_WELL_ZINDEX;
                  setWellPieceLocations((prev) => ({
                    ...prev,
                    [target.wellId]: id,
                  }));
                  setPieceStatusMap((prev) => ({
                    ...prev,
                    [id]: PieceStatus.inWell,
                  }));
                  setMoveInProgressDelayed(false, 300);
                  return;
                }
              }
            }

            // Blocked slot or occupied space — return to original well
            if (currentWellLayout) {
              snapToLayout(
                currentWellLayout.pageX,
                currentWellLayout.pageY,
                currentWellLayout.width,
                currentWellLayout.height,
                GameElements.PIECE_WELL_SCALE
              );
              animate.zIndex.value = GameElements.PIECE_WELL_ZINDEX;
            }
            if (currentWellEntry) {
              setWellPieceLocations((prev) => ({
                ...prev,
                [currentWellEntry]: id,
              }));
            }
            setPieceStatusMap((prev) => ({
              ...prev,
              [id]: PieceStatus.inWell,
            }));
            setMoveInProgressDelayed(false, 300);
            return;
          }

          // Missed all cells — return to well
          if (currentWellLayout) {
            snapToLayout(
              currentWellLayout.pageX,
              currentWellLayout.pageY,
              currentWellLayout.width,
              currentWellLayout.height,
              GameElements.PIECE_WELL_SCALE
            );
            animate.zIndex.value = GameElements.PIECE_WELL_ZINDEX;
          }
          if (currentWellEntry) {
            setWellPieceLocations((prev) => ({
              ...prev,
              [currentWellEntry]: id,
            }));
          }
          setPieceStatusMap((prev) => ({
            ...prev,
            [id]: PieceStatus.inWell,
          }));
          setMoveInProgressDelayed(false, 300);
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
      snapToLayout,
      dropPiece,
      setPieceStatusMap,
      setWellPieceLocations,
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
