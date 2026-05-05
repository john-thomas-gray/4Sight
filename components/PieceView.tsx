import {
  animateBlockingPieceBump,
  animateDroppedPieceBlockedInSlot,
  BLOCKED_DROP_RETURN_START_MS,
} from "@/animations/blockedSlotDrop";
import { animatePieceReturnToWellResting } from "@/animations/pieceReturnToWell";
import { animatePieceSlotThroughSpaceDrop } from "@/animations/pieceSlotThroughSpaceDrop";
import { GameElements } from "@/constants";
import {
  TURN_CHANGE_COMMIT_DELAY_MS,
  TURN_CHANGE_SETTLE_BUFFER_MS,
} from "@/constants/logic";
import { PieceStatus, useGameSession } from "@/context/GameSessionContext";
import { useLayout } from "@/context/LayoutContext";
import { usePlayfieldFrameOptional } from "@/context/PlayfieldFrameContext";
import { useSettings } from "@/context/SettingsContext";
import { useUi } from "@/context/UiContext";
import { TUTORIAL_STEP_ONE_FOCUS_PIECE_ID } from "@/tutorial/gamePlayTutorialSteps";
import { getSlotEntryDirection, Team } from "@/engine";
import { RETURN_TO_WELL } from "@/types/animation";
import { CellType, EachCellType } from "@/types/board";
import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
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
    tutorialWhiteDropEntryDirectionRef,
  } = useGameSession();
  const layout = useLayout();
  const playfield = usePlayfieldFrameOptional();
  const { theme, piecePlacementPreviews } = useSettings();
  const {
    moveInProgress,
    setMoveInProgress,
    setMoveInProgressDelayed,
    setHoverPreview,
    isPreviewingGravity,
    tutorialWellPieceIdlePulseActive,
    tutorialWellPiecePulseScale,
  } = useUi();

  const animate = pieceAnims[id];
  const heldJiggleRotation = useSharedValue(0);
  const heldJiggleX = useSharedValue(0);
  const heldJiggleY = useSharedValue(0);
  const status = pieceStatusMap[id] ?? PieceStatus.inWell;
  const dragYOffset = team === Team.One ? -50 : 50;

  const hiddenByPreview = isPreviewingGravity && status === PieceStatus.onBoard;

  useEffect(() => {
    if (!animate) return;
    animate.winnerColor.value =
      team === Team.One
        ? theme.colorTheme.TEAM_ONE_WINNER_COLOR
        : theme.colorTheme.TEAM_TWO_WINNER_COLOR;
    if (status === PieceStatus.winner) {
      animate.color.value = animate.winnerColor.value;
      return;
    }
    animate.color.value =
      team === Team.One
        ? theme.colorTheme.TEAM_ONE_COLOR
        : theme.colorTheme.TEAM_TWO_COLOR;
  }, [animate, team, theme, status]);

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

  const hiddenOffWell =
    status === PieceStatus.inWell && currentWellEntry === null;

  const applyTutorialWellIdlePulse =
    id === TUTORIAL_STEP_ONE_FOCUS_PIECE_ID &&
    status === PieceStatus.inWell &&
    tutorialWellPieceIdlePulseActive;

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

  const startHeldJiggle = useCallback(() => {
    heldJiggleRotation.value = 0;
    heldJiggleX.value = 0;
    heldJiggleY.value = 0;
    heldJiggleRotation.value = withRepeat(
      withSequence(
        withTiming(-7, {
          duration: 55,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(7, {
          duration: 95,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(0, {
          duration: 55,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      -1,
      false,
    );
    heldJiggleX.value = withRepeat(
      withSequence(
        withTiming(-2, { duration: 55, easing: Easing.inOut(Easing.quad) }),
        withTiming(2, { duration: 95, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 55, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    heldJiggleY.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 55, easing: Easing.inOut(Easing.quad) }),
        withTiming(-1.2, { duration: 95, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 55, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [heldJiggleRotation, heldJiggleX, heldJiggleY]);

  const stopHeldJiggle = useCallback(() => {
    cancelAnimation(heldJiggleRotation);
    cancelAnimation(heldJiggleX);
    cancelAnimation(heldJiggleY);
    heldJiggleRotation.value = withTiming(0, {
      duration: 80,
      easing: Easing.out(Easing.quad),
    });
    heldJiggleX.value = withTiming(0, {
      duration: 80,
      easing: Easing.out(Easing.quad),
    });
    heldJiggleY.value = withTiming(0, {
      duration: 80,
      easing: Easing.out(Easing.quad),
    });
  }, [heldJiggleRotation, heldJiggleX, heldJiggleY]);

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
          playfield?.playfieldRef.current?.measureInWindow((x, y) => {
            if (playfield) {
              playfield.windowOriginRef.current = { x, y };
            }
          });
          animate.scaleX.value = GameElements.PIECE_HELD_SCALE;
          animate.scaleY.value = GameElements.PIECE_HELD_SCALE;
          animate.zIndex.value = GameElements.PIECE_HELD_ZINDEX;
          startHeldJiggle();

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
          const ox = playfield?.windowOriginRef.current.x ?? 0;
          const oy = playfield?.windowOriginRef.current.y ?? 0;
          animate.translateX.value =
            event.absoluteX - ox - GameElements.PIECE_RADIUS;
          animate.translateY.value =
            event.absoluteY - oy - GameElements.PIECE_RADIUS + dragYOffset;

          // Match hover sensing to rendered piece position (same Y offset as drag).
          const pieceCenterX = event.absoluteX - ox;
          const pieceCenterY = event.absoluteY - oy + dragYOffset;

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

          if (!piecePlacementPreviews) {
            setHoverPreview((prev) => (prev ? null : prev));
            return;
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
          stopHeldJiggle();
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

          if (outcome.kind === "blockedSlot") {
            const slotKey = `${outcome.slotCoord.row}-${outcome.slotCoord.col}`;
            const slotLayout = layout.slots[slotKey];
            const blockSpaceLayout = layout.spaces[outcome.blockingKey];
            const blockerAnim = pieceAnims[outcome.blockingPieceId];
            const originLayout = origin?.layout;
            const originWellId = origin?.id;
            if (
              slotLayout &&
              blockSpaceLayout &&
              blockerAnim &&
              originLayout &&
              originWellId
            ) {
              animateDroppedPieceBlockedInSlot(
                animate,
                slotLayout,
                outcome.entryDirection,
              );
              animateBlockingPieceBump(
                blockerAnim,
                blockSpaceLayout,
                outcome.entryDirection,
              );

              setTimeout(() => {
                const targetX =
                  originLayout.pageX +
                  originLayout.width / 2 -
                  GameElements.PIECE_RADIUS;
                const targetY =
                  originLayout.pageY +
                  originLayout.height / 2 -
                  GameElements.PIECE_RADIUS;
                animatePieceReturnToWellResting(animate, targetX, targetY);
              }, BLOCKED_DROP_RETURN_START_MS);

              const commitReturnToWellBlocked = () => {
                setWellPieceLocations((prev) => ({
                  ...prev,
                  [originWellId]: id,
                }));
                setPieceStatusMap((prev) => ({
                  ...prev,
                  [id]: PieceStatus.inWell,
                }));
                originWellRef.current = null;
              };
              setTimeout(
                commitReturnToWellBlocked,
                BLOCKED_DROP_RETURN_START_MS + RETURN_TO_WELL,
              );
              setMoveInProgressDelayed(
                false,
                BLOCKED_DROP_RETURN_START_MS + RETURN_TO_WELL + 40,
              );
              return;
            }
          }

          if (outcome.kind === "placed") {
            const spaceLayout = layout.spaces[outcome.landingKey];
            const slotKey = `${outcome.slotCoord.row}-${outcome.slotCoord.col}`;
            const slotLayout = layout.slots[slotKey];
            if (spaceLayout) {
              if (slotLayout) {
                animatePieceSlotThroughSpaceDrop(
                  animate,
                  slotLayout,
                  spaceLayout,
                );
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
                if (id === TUTORIAL_STEP_ONE_FOCUS_PIECE_ID) {
                  const entryDir = getSlotEntryDirection(outcome.slotCoord);
                  if (entryDir != null) {
                    tutorialWhiteDropEntryDirectionRef.current = entryDir;
                  }
                }
                setPieceStatusMap((prev) => ({
                  ...prev,
                  [id]: PieceStatus.onBoard,
                }));
                originWellRef.current = null;
              };
              if (slotLayout) {
                setTimeout(commitPlacement, TURN_CHANGE_COMMIT_DELAY_MS);
                setMoveInProgressDelayed(
                  false,
                  TURN_CHANGE_COMMIT_DELAY_MS + TURN_CHANGE_SETTLE_BUFFER_MS,
                );
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

          if (origin?.layout) {
            const targetX =
              origin.layout.pageX +
              origin.layout.width / 2 -
              GameElements.PIECE_RADIUS;
            const targetY =
              origin.layout.pageY +
              origin.layout.height / 2 -
              GameElements.PIECE_RADIUS;
            animatePieceReturnToWellResting(animate, targetX, targetY);
          }
          const commitReturnToWell = () => {
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
          };
          if (origin?.layout) {
            setTimeout(commitReturnToWell, RETURN_TO_WELL);
            setMoveInProgressDelayed(false, RETURN_TO_WELL + 40);
          } else {
            commitReturnToWell();
            setMoveInProgressDelayed(false, 300);
          }
        })
        .onFinalize(() => {
          stopHeldJiggle();
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
      pieceAnims,
      snapToLayout,
      startHeldJiggle,
      stopHeldJiggle,
      dropPiece,
      setPieceStatusMap,
      setWellPieceLocations,
      setMoveInProgress,
      setMoveInProgressDelayed,
      setHoverPreview,
      dragYOffset,
      piecePlacementPreviews,
      playfield,
      tutorialWhiteDropEntryDirectionRef,
    ],
  );

  const animatedStyles = useAnimatedStyle(() => {
    const pulse = applyTutorialWellIdlePulse
      ? tutorialWellPiecePulseScale.value
      : 1;
    return {
      transform: [
        { translateX: animate.translateX.value },
        { translateY: animate.translateY.value },
        { translateX: heldJiggleX.value },
        { translateY: heldJiggleY.value },
        { rotate: `${heldJiggleRotation.value}deg` },
        { scaleX: animate.scaleX.value * pulse },
        { scaleY: animate.scaleY.value * pulse },
      ],
      zIndex: animate.zIndex.value,
      backgroundColor: animate.color.value,
    };
  }, [
    applyTutorialWellIdlePulse,
    animate,
    heldJiggleRotation,
    heldJiggleX,
    heldJiggleY,
    tutorialWellPiecePulseScale,
  ]);

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
          hiddenByPreview || hiddenOffWell ? { opacity: 0 } : null,
          hiddenOffWell ? { pointerEvents: "none" } : null,
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
