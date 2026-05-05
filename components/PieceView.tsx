import {
  animateBlockingPieceBump,
  animateDroppedPieceBlockedInSlot,
  BLOCKED_DROP_RETURN_START_MS,
} from "@/animations/blockedSlotDrop";
import {
  animatePieceReturnToWellResting,
  PIECE_RETURN_TO_WELL_CENTER_MS,
  PIECE_RETURN_TO_WELL_LIFT_SETTLE_MS,
  PIECE_RETURN_TO_WELL_LOWER_MS,
  PIECE_RETURN_TO_WELL_TOTAL_MS,
} from "@/animations/pieceReturnToWell";
import {
  animatePieceSlotThroughSpaceDrop,
  SLOT_CENTER_MS,
  SLOT_LOWER_IN_SLOT_MS,
} from "@/animations/pieceSlotThroughSpaceDrop";
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
import { CellType, EachCellType } from "@/types/board";
import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import Glow from "./Glow";
import { resolveDropOutcome } from "./pieceDropController";

type PieceViewProps = {
  id: string;
  team: Team;
  entranceOpacity?: SharedValue<number>;
  entranceTranslateX?: SharedValue<number>;
  entranceTranslateY?: SharedValue<number>;
};

const SNAP_SHADOW_DESCEND_MS = 300;

function resolveShadowAnchorStyle(
  scale: number,
  lift: number,
  pieceCenterX: number,
  pieceCenterY: number,
  sunX: number,
  sunY: number,
  nearestSunDistance: number,
  farthestSunDistance: number,
  jiggleX: number,
  jiggleY: number,
) {
  "worklet";

  const sproutVisibility = Math.max(0, Math.min(1, scale));
  const sunToPieceX = pieceCenterX - sunX;
  const sunToPieceY = pieceCenterY - sunY;
  const sunDistance = Math.max(
    1,
    Math.sqrt(sunToPieceX * sunToPieceX + sunToPieceY * sunToPieceY),
  );
  const unitX = sunToPieceX / sunDistance;
  const unitY = sunToPieceY / sunDistance;
  const sunDistanceRange = Math.max(1, farthestSunDistance - nearestSunDistance);
  const distanceFromSun = Math.max(
    0,
    Math.min(1, (sunDistance - nearestSunDistance) / sunDistanceRange),
  );
  const liftedOffset = lift * (12 + distanceFromSun * 46);

  return {
    opacity: (0.18 + lift * 0.2) * sproutVisibility,
    transform: [
      { translateX: unitX * liftedOffset + jiggleX * 0.15 },
      { translateY: unitY * liftedOffset + jiggleY * 0.15 },
    ],
  };
}

function resolveShadowShapeStyle(
  scale: number,
  lift: number,
  pieceCenterX: number,
  pieceCenterY: number,
  sunX: number,
  sunY: number,
  nearestSunDistance: number,
  farthestSunDistance: number,
) {
  "worklet";

  const sproutVisibility = Math.max(0, Math.min(1, scale));
  const sunToPieceX = pieceCenterX - sunX;
  const sunToPieceY = pieceCenterY - sunY;
  const sunDistance = Math.max(
    1,
    Math.sqrt(sunToPieceX * sunToPieceX + sunToPieceY * sunToPieceY),
  );
  const unitX = sunToPieceX / sunDistance;
  const unitY = sunToPieceY / sunDistance;
  const sunDistanceRange = Math.max(1, farthestSunDistance - nearestSunDistance);
  const distanceFromSun = Math.max(
    0,
    Math.min(1, (sunDistance - nearestSunDistance) / sunDistanceRange),
  );
  const baseScale = Math.max(0.22, (0.65 + lift * 2.15) * sproutVisibility);
  const castStretch = 0.2 + distanceFromSun * 1.12;

  return {
    transform: [
      { rotate: `${Math.atan2(unitY, unitX)}rad` },
      { scaleX: baseScale * (1 + lift * castStretch) },
      { scaleY: baseScale * (1 + lift * 0.06) },
    ],
  };
}

const PieceView: React.FC<PieceViewProps> = ({
  id,
  team,
  entranceOpacity,
  entranceTranslateX,
  entranceTranslateY,
}) => {
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
  const { theme } = useSettings();
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
  const pieceLift = useSharedValue(0);
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
  const releaseHandledRef = useRef(false);
  const shadowGradientId = useMemo(() => `piece-shadow-${id}`, [id]);

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

  const shadowSun = useMemo(() => {
    const spaces = Object.values(layout.spaces);
    if (spaces.length === 0) {
      return {
        x: GameElements.BASE_CELL_SIZE * 9,
        y: GameElements.BASE_CELL_SIZE * 4.5,
        nearestDistance: GameElements.BASE_CELL_SIZE * 2,
        farthestDistance: GameElements.BASE_CELL_SIZE * 10,
      };
    }

    const minX = Math.min(...spaces.map((space) => space.pageX));
    const minY = Math.min(...spaces.map((space) => space.pageY));
    const maxX = Math.max(
      ...spaces.map((space) => space.pageX + space.width),
    );
    const maxY = Math.max(
      ...spaces.map((space) => space.pageY + space.height),
    );
    const boardWidth = maxX - minX;
    const boardCenterY = minY + (maxY - minY) / 2;
    const sunX = maxX + boardWidth * 0.55;
    const sunY = boardCenterY;
    const nearestDistance = Math.max(1, sunX - maxX);
    const farthestVerticalDistance = Math.max(
      Math.abs(sunY - minY),
      Math.abs(maxY - sunY),
    );
    const farthestDistance = Math.sqrt(
      (sunX - minX) * (sunX - minX) +
        farthestVerticalDistance * farthestVerticalDistance,
    );

    return {
      x: sunX,
      y: sunY,
      nearestDistance,
      farthestDistance,
    };
  }, [layout.spaces]);

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
    cancelAnimation(pieceLift);
    pieceLift.value = withTiming(1, {
      duration: 140,
      easing: Easing.out(Easing.quad),
    });
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
  }, [heldJiggleRotation, heldJiggleX, heldJiggleY, pieceLift]);

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

  const reversePieceLift = useCallback(
    (duration: number, delayMs = 0) => {
      cancelAnimation(pieceLift);
      const descend = withTiming(0, {
        duration,
        easing: Easing.inOut(Easing.quad),
      });
      pieceLift.value = delayMs > 0 ? withDelay(delayMs, descend) : descend;
    },
    [pieceLift],
  );

  const returnPieceLiftToWell = useCallback(
    (holdMs: number) => {
      cancelAnimation(pieceLift);
      const descend = withTiming(0, {
        duration: PIECE_RETURN_TO_WELL_LOWER_MS,
        easing: Easing.inOut(Easing.quad),
      });

      if (holdMs <= 0) {
        pieceLift.value = descend;
        return;
      }

      const liftSettleMs = Math.min(
        PIECE_RETURN_TO_WELL_LIFT_SETTLE_MS,
        holdMs,
      );
      const holdAtLiftMs = holdMs - liftSettleMs;

      pieceLift.value =
        holdAtLiftMs > 0
          ? withSequence(
              withTiming(1, {
                duration: liftSettleMs,
                easing: Easing.out(Easing.quad),
              }),
              withTiming(1, { duration: holdAtLiftMs }),
              descend,
            )
          : withSequence(
              withTiming(1, {
                duration: liftSettleMs,
                easing: Easing.out(Easing.quad),
              }),
              descend,
            );
    },
    [pieceLift],
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
          releaseHandledRef.current = false;
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
          setHoverPreview((prev) => (prev ? null : prev));
        })
        .onEnd(() => {
          releaseHandledRef.current = true;
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
              returnPieceLiftToWell(
                BLOCKED_DROP_RETURN_START_MS + PIECE_RETURN_TO_WELL_CENTER_MS,
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
                BLOCKED_DROP_RETURN_START_MS + PIECE_RETURN_TO_WELL_TOTAL_MS,
              );
              setMoveInProgressDelayed(
                false,
                BLOCKED_DROP_RETURN_START_MS +
                  PIECE_RETURN_TO_WELL_TOTAL_MS +
                  40,
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
                reversePieceLift(SLOT_LOWER_IN_SLOT_MS, SLOT_CENTER_MS);
              } else {
                snapToLayout(
                  spaceLayout.pageX,
                  spaceLayout.pageY,
                  spaceLayout.width,
                  spaceLayout.height,
                  GameElements.PIECE_BOARD_SCALE,
                );
                reversePieceLift(SNAP_SHADOW_DESCEND_MS);
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
              reversePieceLift(SNAP_SHADOW_DESCEND_MS);
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
            returnPieceLiftToWell(PIECE_RETURN_TO_WELL_CENTER_MS);
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
            originWellRef.current = null;
          };
          if (origin?.layout) {
            setTimeout(commitReturnToWell, PIECE_RETURN_TO_WELL_TOTAL_MS);
            setMoveInProgressDelayed(false, PIECE_RETURN_TO_WELL_TOTAL_MS + 40);
          } else {
            reversePieceLift(SNAP_SHADOW_DESCEND_MS);
            commitReturnToWell();
            setMoveInProgressDelayed(false, 300);
          }
        })
        .onFinalize(() => {
          if (!releaseHandledRef.current) {
            stopHeldJiggle();
            reversePieceLift(PIECE_RETURN_TO_WELL_LOWER_MS);
          }
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
      reversePieceLift,
      returnPieceLiftToWell,
      startHeldJiggle,
      stopHeldJiggle,
      dropPiece,
      setPieceStatusMap,
      setWellPieceLocations,
      setMoveInProgress,
      setMoveInProgressDelayed,
      setHoverPreview,
      dragYOffset,
      playfield,
      tutorialWhiteDropEntryDirectionRef,
    ],
  );

  const piecePositionStyle = useAnimatedStyle(
    () => ({
      opacity: entranceOpacity?.value ?? 1,
      transform: [
        {
          translateX:
            animate.translateX.value + (entranceTranslateX?.value ?? 0),
        },
        {
          translateY:
            animate.translateY.value + (entranceTranslateY?.value ?? 0),
        },
      ],
      zIndex: animate.zIndex.value,
    }),
    [animate, entranceOpacity, entranceTranslateX, entranceTranslateY],
  );

  const pieceShadowAnchorStyle = useAnimatedStyle(() => {
    const pulse = applyTutorialWellIdlePulse
      ? tutorialWellPiecePulseScale.value
      : 1;
    return resolveShadowAnchorStyle(
      Math.max(animate.scaleX.value, animate.scaleY.value) * pulse,
      Math.max(0, Math.min(1, pieceLift.value)),
      animate.translateX.value + GameElements.PIECE_RADIUS,
      animate.translateY.value + GameElements.PIECE_RADIUS,
      shadowSun.x,
      shadowSun.y,
      shadowSun.nearestDistance,
      shadowSun.farthestDistance,
      heldJiggleX.value,
      heldJiggleY.value,
    );
  }, [
    applyTutorialWellIdlePulse,
    animate,
    heldJiggleX,
    heldJiggleY,
    pieceLift,
    shadowSun,
    tutorialWellPiecePulseScale,
  ]);

  const pieceShadowShapeStyle = useAnimatedStyle(() => {
    const pulse = applyTutorialWellIdlePulse
      ? tutorialWellPiecePulseScale.value
      : 1;
    return resolveShadowShapeStyle(
      Math.max(animate.scaleX.value, animate.scaleY.value) * pulse,
      Math.max(0, Math.min(1, pieceLift.value)),
      animate.translateX.value + GameElements.PIECE_RADIUS,
      animate.translateY.value + GameElements.PIECE_RADIUS,
      shadowSun.x,
      shadowSun.y,
      shadowSun.nearestDistance,
      shadowSun.farthestDistance,
    );
  }, [
    applyTutorialWellIdlePulse,
    animate,
    pieceLift,
    shadowSun,
    tutorialWellPiecePulseScale,
  ]);

  const pieceFaceStyle = useAnimatedStyle(() => {
    const pulse = applyTutorialWellIdlePulse
      ? tutorialWellPiecePulseScale.value
      : 1;
    return {
      transform: [
        { translateX: heldJiggleX.value },
        { translateY: heldJiggleY.value },
        { rotate: `${heldJiggleRotation.value}deg` },
        { scaleX: animate.scaleX.value * pulse },
        { scaleY: animate.scaleY.value * pulse },
      ],
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

  const positionStyle: ViewStyle = {
    height: GameElements.PIECE_SIZE,
    width: GameElements.PIECE_SIZE,
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "visible",
  };

  const shadowStyle: ViewStyle = {
    position: "absolute",
    left: GameElements.PIECE_SIZE * 0.1875,
    top: GameElements.PIECE_SIZE * 0.1875,
    width: GameElements.PIECE_SIZE * 0.625,
    height: GameElements.PIECE_SIZE * 0.625,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  };

  const shadowShapeStyle: ViewStyle = {
    width: GameElements.PIECE_SIZE * 0.625,
    height: GameElements.PIECE_SIZE * 0.625,
    overflow: "visible",
  };

  const faceStyle: ViewStyle = {
    height: GameElements.PIECE_SIZE,
    width: GameElements.PIECE_SIZE,
    borderRadius: GameElements.PIECE_RADIUS,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  };

  return (
    <GestureDetector gesture={movePiece}>
      <Animated.View
        pointerEvents={
          status === PieceStatus.onBoard || hiddenOffWell ? "none" : "auto"
        }
        style={[
          positionStyle,
          piecePositionStyle,
          status === PieceStatus.inWell
            ? { zIndex: GameElements.PIECE_WELL_ZINDEX }
            : null,
          hiddenByPreview || hiddenOffWell ? { opacity: 0 } : null,
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[shadowStyle, pieceShadowAnchorStyle]}
        >
          <Animated.View style={[shadowShapeStyle, pieceShadowShapeStyle]}>
            <Svg height="100%" width="100%" viewBox="0 0 64 64">
              <Defs>
                <RadialGradient
                  id={shadowGradientId}
                  cx="38%"
                  cy="50%"
                  r="72%"
                >
                  <Stop offset="0" stopColor="black" stopOpacity="0.72" />
                  <Stop offset="0.48" stopColor="black" stopOpacity="0.28" />
                  <Stop offset="0.78" stopColor="black" stopOpacity="0.08" />
                  <Stop offset="1" stopColor="black" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle
                cx="32"
                cy="32"
                r="31"
                fill={`url(#${shadowGradientId})`}
              />
            </Svg>
          </Animated.View>
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[faceStyle, pieceFaceStyle]}
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
      </Animated.View>
    </GestureDetector>
  );
};

export default memo(PieceView);
