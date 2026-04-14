import { GameElements } from "@/constants";
import { PieceStatus, useGameSession } from "@/context/GameSessionContext";
import { useLayout } from "@/context/LayoutContext";
import { useSettings } from "@/context/SettingsContext";
import { useUi } from "@/context/UiContext";
import { Team } from "@/engine";
import { CellType, EachCellType } from "@/types/board";
import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Glow from "./Glow";
import { resolveDropOutcome, resolveDropTarget } from "./pieceDropController";

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
  const {
    moveInProgress,
    setMoveInProgress,
    setMoveInProgressDelayed,
    setHoverPreview,
    isPreviewingGravity,
  } = useUi();

  const animate = pieceAnims[id];
  const status = pieceStatusMap[id] ?? PieceStatus.inWell;
  const dragYOffset = team === Team.One ? -50 : 50;

  const hiddenByPreview = isPreviewingGravity && status === PieceStatus.onBoard;

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
      ([, pid]) => pid === id,
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

  const originWellRef = useRef<{
    id: string;
    layout: typeof currentWellLayout;
  } | null>(null);

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
      scale: number,
    ) => {
      animate.translateX.value =
        targetPageX + targetWidth / 2 - GameElements.PIECE_RADIUS;
      animate.translateY.value =
        targetPageY + targetHeight / 2 - GameElements.PIECE_RADIUS;
      animate.scaleX.value = scale;
      animate.scaleY.value = scale;
    },
    [animate],
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
            (status === PieceStatus.isHeld || !moveInProgress),
        )
        .hitSlop({ left: 24, right: 24, top: 24, bottom: 24 })
        .onStart(() => {
          animate.scaleX.value = GameElements.PIECE_HELD_SCALE;
          animate.scaleY.value = GameElements.PIECE_HELD_SCALE;
          animate.zIndex.value = GameElements.PIECE_HELD_ZINDEX;

          if (currentWellEntry) {
            originWellRef.current = {
              id: currentWellEntry,
              layout: currentWellLayout,
            };
            setWellPieceLocations((prev) => {
              const next = { ...prev };
              delete next[currentWellEntry];
              return next;
            });
          }
          setPieceStatusMap((prev) => ({ ...prev, [id]: PieceStatus.isHeld }));
          setMoveInProgress(true);
          setHoverPreview(null);
        })
        .onUpdate((event) => {
          animate.translateX.value =
            event.absoluteX - GameElements.PIECE_RADIUS;
          animate.translateY.value =
            event.absoluteY - GameElements.PIECE_RADIUS + dragYOffset;

          // Match hover sensing to rendered piece position (same Y offset as drag).
          const pieceCenterX = event.absoluteX;
          const pieceCenterY = event.absoluteY + dragYOffset;

          let hitCellId: string | null = null;
          for (const cell of allCells) {
            if (!cell.layout) continue;
            const { pageX, pageY, width, height } = cell.layout;
            const inBounds =
              pieceCenterX >= pageX &&
              pieceCenterX <= pageX + width &&
              pieceCenterY >= pageY &&
              pieceCenterY <= pageY + height;
            if (inBounds) {
              hitCellId = cell.id;
              break;
            }
          }

          if (!hitCellId) {
            setHoverPreview((prev) => (prev ? null : prev));
            return;
          }

          const target = resolveDropTarget(
            hitCellId,
            gameState.board,
            layout.slots,
            layout.spaces,
            layout.wells[team],
          );

          if (target.kind !== "slot") {
            setHoverPreview((prev) => (prev ? null : prev));
            return;
          }

          const next = { spaceId: target.landingKey, team };
          setHoverPreview((prev) =>
            prev && prev.spaceId === next.spaceId && prev.team === next.team
              ? prev
              : next,
          );
        })
        .onEnd(() => {
          setHoverPreview(null);
          const origin = originWellRef.current;
          const pieceCenter = {
            x: animate.translateX.value + GameElements.PIECE_RADIUS,
            y: animate.translateY.value + GameElements.PIECE_RADIUS,
          };

          let hitCellId: string | null = null;
          for (const cell of allCells) {
            if (!cell.layout) continue;
            const { pageX, pageY, width, height } = cell.layout;
            const inBounds =
              pieceCenter.x >= pageX &&
              pieceCenter.x <= pageX + width &&
              pieceCenter.y >= pageY &&
              pieceCenter.y <= pageY + height;
            if (inBounds) {
              hitCellId = cell.id;
              break;
            }
          }

          const outcome = hitCellId
            ? resolveDropOutcome(
                hitCellId,
                gameState.board,
                layout.slots,
                layout.spaces,
                layout.wells[team],
                wellPieceLocations,
                origin?.id ?? "",
              )
            : { kind: "returnToWell" as const, originWellId: origin?.id ?? "" };

          // #region agent log
          console.log(
            "[DROP]",
            JSON.stringify({
              pieceId: id,
              originWell: origin?.id,
              hitCellId,
              outcome,
            }),
          );
          fetch(
            "http://127.0.0.1:7550/ingest/52e59372-0baa-4c90-83e2-0c082cfd8bb2",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Debug-Session-Id": "ed3eae",
              },
              body: JSON.stringify({
                sessionId: "ed3eae",
                location: "PieceView.tsx:onEnd",
                message: "drop-resolved",
                data: {
                  pieceId: id,
                  originWell: origin?.id,
                  hitCellId,
                  outcome,
                },
                timestamp: Date.now(),
                hypothesisId: "H4",
              }),
            },
          ).catch(() => {});
          // #endregion

          if (outcome.kind === "placed") {
            const spaceLayout = layout.spaces[outcome.landingKey];
            const slotKey = `${outcome.slotCoord.row}-${outcome.slotCoord.col}`;
            const slotLayout = layout.slots[slotKey];
            if (spaceLayout) {
              const placementCommitDelayMs = 980;
              const landingX =
                spaceLayout.pageX +
                spaceLayout.width / 2 -
                GameElements.PIECE_RADIUS;
              const landingY =
                spaceLayout.pageY +
                spaceLayout.height / 2 -
                GameElements.PIECE_RADIUS;

              if (slotLayout) {
                const slotX =
                  slotLayout.pageX +
                  slotLayout.width / 2 -
                  GameElements.PIECE_RADIUS;
                const slotY =
                  slotLayout.pageY +
                  slotLayout.height / 2 -
                  GameElements.PIECE_RADIUS;
                const isVerticalDrop =
                  Math.abs(landingY - slotY) >= Math.abs(landingX - slotX);

                // 1) Slide into slot center
                // 2) Pause briefly
                // 3) Drop to final space with bounce on the drop axis
                animate.translateX.value = withSequence(
                  withTiming(slotX, { duration: 120 }),
                  withDelay(
                    90,
                    withTiming(landingX, {
                      duration: isVerticalDrop ? 320 : 700,
                      easing: isVerticalDrop ? Easing.linear : Easing.bounce,
                    }),
                  ),
                );
                animate.translateY.value = withSequence(
                  withTiming(slotY, { duration: 120 }),
                  withDelay(
                    90,
                    withTiming(landingY, {
                      duration: isVerticalDrop ? 700 : 320,
                      easing: isVerticalDrop ? Easing.bounce : Easing.linear,
                    }),
                  ),
                );
                animate.scaleX.value = withTiming(
                  GameElements.PIECE_BOARD_SCALE,
                  {
                    duration: 110,
                  },
                );
                animate.scaleY.value = withTiming(
                  GameElements.PIECE_BOARD_SCALE,
                  {
                    duration: 110,
                  },
                );
                // Lower elevation while entering the slot so it appears to sink into the board.
                animate.zIndex.value = withTiming(900, { duration: 180 });
              } else {
                snapToLayout(
                  spaceLayout.pageX,
                  spaceLayout.pageY,
                  spaceLayout.width,
                  spaceLayout.height,
                  GameElements.PIECE_BOARD_SCALE,
                );
              }
              const commitPlacement = () => {
                animate.zIndex.value = GameElements.PIECE_BOARD_ZINDEX;
                dropPiece(outcome.slotCoord, id);
                setPieceStatusMap((prev) => ({
                  ...prev,
                  [id]: PieceStatus.onBoard,
                }));
                originWellRef.current = null;
                // #region agent log
                console.log(
                  "[DROP:PLACED]",
                  JSON.stringify({
                    pieceId: id,
                    landingKey: outcome.landingKey,
                  }),
                );
                fetch(
                  "http://127.0.0.1:7550/ingest/52e59372-0baa-4c90-83e2-0c082cfd8bb2",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "X-Debug-Session-Id": "ed3eae",
                    },
                    body: JSON.stringify({
                      sessionId: "ed3eae",
                      location: "PieceView.tsx:placed",
                      message: "piece-placed",
                      data: { pieceId: id, landingKey: outcome.landingKey },
                      timestamp: Date.now(),
                      hypothesisId: "H1",
                    }),
                  },
                ).catch(() => {});
                // #endregion
              };
              if (slotLayout) {
                setTimeout(commitPlacement, placementCommitDelayMs);
                setMoveInProgressDelayed(false, placementCommitDelayMs + 80);
              } else {
                commitPlacement();
                setMoveInProgressDelayed(false, 300);
              }
              return;
            }
          }

          if (outcome.kind === "well") {
            const wellLayout = layout.wells[team]?.[outcome.wellId];
            if (wellLayout) {
              snapToLayout(
                wellLayout.pageX,
                wellLayout.pageY,
                wellLayout.width,
                wellLayout.height,
                GameElements.PIECE_WELL_SCALE,
              );
              animate.zIndex.value = GameElements.PIECE_WELL_ZINDEX;
              setWellPieceLocations((prev) => ({
                ...prev,
                [outcome.wellId]: id,
              }));
              setPieceStatusMap((prev) => ({
                ...prev,
                [id]: PieceStatus.inWell,
              }));
              originWellRef.current = null;
              setMoveInProgressDelayed(false, 300);
              return;
            }
          }

          // returnToWell — snap back to original well using the ref
          // #region agent log
          console.log(
            "[DROP:RETURN_TO_WELL]",
            JSON.stringify({
              pieceId: id,
              originWellId: origin?.id,
              hasLayout: !!origin?.layout,
            }),
          );
          fetch(
            "http://127.0.0.1:7550/ingest/52e59372-0baa-4c90-83e2-0c082cfd8bb2",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Debug-Session-Id": "ed3eae",
              },
              body: JSON.stringify({
                sessionId: "ed3eae",
                location: "PieceView.tsx:returnToWell",
                message: "returning-to-well",
                data: {
                  pieceId: id,
                  originWellId: origin?.id,
                  hasLayout: !!origin?.layout,
                },
                timestamp: Date.now(),
                hypothesisId: "H2,H3",
              }),
            },
          ).catch(() => {});
          // #endregion
          if (origin?.layout) {
            snapToLayout(
              origin.layout.pageX,
              origin.layout.pageY,
              origin.layout.width,
              origin.layout.height,
              GameElements.PIECE_WELL_SCALE,
            );
            animate.zIndex.value = GameElements.PIECE_WELL_ZINDEX;
          }
          if (origin?.id) {
            setWellPieceLocations((prev) => ({
              ...prev,
              [origin.id]: id,
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
      setHoverPreview,
      dragYOffset,
    ],
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
          hiddenByPreview ? { opacity: 0 } : null,
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
