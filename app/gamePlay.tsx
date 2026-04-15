import { loadingScreenDismissDelayMs } from "@/animations/loadingAnimations";
import BackButton from "@/components/BackButton";
import BoardGridView from "@/components/BoardGridView";
import GravityGestureLayer from "@/components/GravityGestureLayer";
import LoadingScreen from "@/components/LoadingScreen";
import PieceView from "@/components/PieceView";
import SlotRim from "@/components/SlotRim";
import TeamWellGrid from "@/components/TeamWellGrid";
import WinOverlay from "@/components/WinOverlay";
import { GameElements } from "@/constants";
import { PIECE_RADIUS } from "@/constants/gameElements";
import {
  TURN_CHANGE_COMMIT_DELAY_MS,
  TURN_CHANGE_SETTLE_BUFFER_MS,
} from "@/constants/logic";
import { PieceStatus, useGameSession } from "@/context/GameSessionContext";
import { useLayout } from "@/context/LayoutContext";
import { useSettings } from "@/context/SettingsContext";
import { useUi } from "@/context/UiContext";
import type { ScenarioMove } from "@/dev/scenarios";
import { getScenario, getScenarioDelay } from "@/dev/scenarios";
import {
  coordToKey,
  Direction,
  findSlotForSpace,
  resolveSlotDrop,
  Team,
} from "@/engine";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import {
  Easing,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const GamePlay = () => {
  const layout = useLayout();
  const {
    gameState,
    pieceStatusMap,
    setPieceStatusMap,
    wellPieceLocations,
    setWellPieceLocations,
    pieceAnims,
    dropPiece,
    loadScenario,
  } = useGameSession();
  const {
    hoverPreview,
    isPreviewingGravity,
    gravityPreviewBoard,
    setMoveInProgress,
    setMoveInProgressDelayed,
  } = useUi();
  const { theme } = useSettings();
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const colors = theme.colorTheme;
  const textColor = colors.ODD_SPACE_COLOR;

  const { scenario: scenarioParam } = useLocalSearchParams<{
    scenario?: string;
  }>();
  const moveQueueRef = useRef<ScenarioMove[] | null>(null);
  const scenarioLoadedRef = useRef(false);
  const pullRef = useRef<((direction: Direction) => void) | null>(null);

  useEffect(() => {
    if (!scenarioParam || scenarioLoadedRef.current) return;
    const scenarioData = getScenario(scenarioParam);
    if (!scenarioData) return;
    scenarioLoadedRef.current = true;
    moveQueueRef.current = loadScenario(scenarioData);
  }, [scenarioParam, loadScenario]);

  const playNextMove = useCallback(() => {
    const queue = moveQueueRef.current;
    if (!queue || queue.length === 0) return;
    if (gameState.status === "finished") return;

    const move = queue.shift();
    if (!move) return;

    if (move.type === "gravity") {
      pullRef.current?.(move.direction);
      return;
    }

    const { targetSpace, pieceId } = move;
    const slotCoord = findSlotForSpace(gameState.board, targetSpace);
    if (!slotCoord) return;

    const landing = resolveSlotDrop(gameState.board, slotCoord);
    if (!landing) return;

    const anim = pieceAnims[pieceId];
    if (!anim) return;

    const slotKey = coordToKey(slotCoord);
    const landingKey = coordToKey(landing);
    const slotLayout = layout.slots[slotKey];
    const spaceLayout = layout.spaces[landingKey];
    if (!slotLayout || !spaceLayout) return;

    setWellPieceLocations((prev) => {
      const next = { ...prev };
      for (const [wellId, pid] of Object.entries(next)) {
        if (pid === pieceId) {
          delete next[wellId];
          break;
        }
      }
      return next;
    });
    setPieceStatusMap((prev) => ({ ...prev, [pieceId]: PieceStatus.isHeld }));
    setMoveInProgress(true);

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

    anim.scaleX.value = GameElements.PIECE_HELD_SCALE;
    anim.scaleY.value = GameElements.PIECE_HELD_SCALE;
    anim.zIndex.value = GameElements.PIECE_HELD_ZINDEX;

    anim.translateX.value = withSequence(
      withTiming(slotX, { duration: 120 }),
      withDelay(
        90,
        withTiming(landingX, {
          duration: isVerticalDrop ? 320 : 700,
          easing: isVerticalDrop ? Easing.linear : Easing.bounce,
        }),
      ),
    );
    anim.translateY.value = withSequence(
      withTiming(slotY, { duration: 120 }),
      withDelay(
        90,
        withTiming(landingY, {
          duration: isVerticalDrop ? 700 : 320,
          easing: isVerticalDrop ? Easing.bounce : Easing.linear,
        }),
      ),
    );
    anim.scaleX.value = withTiming(GameElements.PIECE_BOARD_SCALE, {
      duration: 110,
    });
    anim.scaleY.value = withTiming(GameElements.PIECE_BOARD_SCALE, {
      duration: 110,
    });
    anim.zIndex.value = withTiming(900, { duration: 180 });

    setTimeout(() => {
      anim.zIndex.value = GameElements.PIECE_BOARD_ZINDEX;
      dropPiece(slotCoord, pieceId);
      setPieceStatusMap((prev) => ({
        ...prev,
        [pieceId]: PieceStatus.onBoard,
      }));
    }, TURN_CHANGE_COMMIT_DELAY_MS);
    setMoveInProgressDelayed(
      false,
      TURN_CHANGE_COMMIT_DELAY_MS + TURN_CHANGE_SETTLE_BUFFER_MS,
    );
  }, [
    gameState.board,
    gameState.status,
    pieceAnims,
    layout.slots,
    layout.spaces,
    dropPiece,
    setPieceStatusMap,
    setWellPieceLocations,
    setMoveInProgress,
    setMoveInProgressDelayed,
  ]);

  useEffect(() => {
    if (showLoadingScreen) return;
    const queue = moveQueueRef.current;
    if (!queue || queue.length === 0) return;
    if (gameState.status === "finished") return;

    const scenario = scenarioParam ? getScenario(scenarioParam) : null;
    const delayMs = scenario ? getScenarioDelay(scenario) : 1200;

    const timer = setTimeout(playNextMove, delayMs);
    return () => clearTimeout(timer);
  }, [
    showLoadingScreen,
    gameState.turnCount,
    gameState.status,
    scenarioParam,
    playNextMove,
  ]);

  useEffect(() => {
    if (!layout.layoutReady) {
      setShowLoadingScreen(true);
      return;
    }
    const timer = setTimeout(
      () => setShowLoadingScreen(false),
      loadingScreenDismissDelayMs,
    );
    return () => clearTimeout(timer);
  }, [layout.layoutReady]);

  // Reposition pieces whenever layout updates (wells or spaces register).
  // Runs every time a new cell registers, so pieces land at the right
  // positions even if wells register incrementally.
  useEffect(() => {
    Object.entries(wellPieceLocations).forEach(([wellId, pieceId]) => {
      const wellLayout =
        layout.wells[Team.One]?.[wellId] ?? layout.wells[Team.Two]?.[wellId];
      const anim = pieceAnims[pieceId];
      if (wellLayout && anim) {
        anim.translateX.value =
          wellLayout.pageX + wellLayout.width / 2 - PIECE_RADIUS;
        anim.translateY.value =
          wellLayout.pageY + wellLayout.height / 2 - PIECE_RADIUS;
      }
    });

    Object.entries(gameState.board).forEach(([spaceId, pieceId]) => {
      const spaceLayout = layout.spaces[spaceId];
      const anim = pieceAnims[pieceId];
      if (spaceLayout && anim) {
        anim.translateX.value =
          spaceLayout.pageX + spaceLayout.width / 2 - PIECE_RADIUS;
        anim.translateY.value =
          spaceLayout.pageY + spaceLayout.height / 2 - PIECE_RADIUS;
        anim.scaleX.value = 1;
        anim.scaleY.value = 1;
      }
    });
  }, [
    layout.wells,
    layout.spaces,
    wellPieceLocations,
    gameState.board,
    pieceAnims,
  ]);

  const piecesToRender = useMemo(
    () => Object.entries(gameState.pieces),
    [gameState.pieces],
  );

  useEffect(() => {
    if (gameState.status !== "finished" || !gameState.winner) {
      setShowWinOverlay(false);
      return;
    }
    const winnerCount = Object.values(pieceStatusMap).filter(
      (s) => s === PieceStatus.winner,
    ).length;
    if (winnerCount === 0) return;
    const timer = setTimeout(() => setShowWinOverlay(true), 1200);
    return () => clearTimeout(timer);
  }, [gameState.status, gameState.winner, pieceStatusMap]);

  return (
    <View
      className="flex-1 flex-col items-center justify-center"
      style={{ backgroundColor: theme.colorTheme.FELT_TOP }}
    >
      <BackButton
        variant="inline"
        textStyle={{ color: textColor }}
        imageStyle={{ tintColor: textColor }}
        style={{
          position: "absolute",
          bottom: 35,
          left: 305,
          borderColor: colors.SLOT_BORDER_COLOR,
          borderWidth: 1,
        }}
      />
      <View className="flex-col items-center justify-center">
        <TeamWellGrid team={Team.Two} />
        <GravityGestureLayer className="mt-7 mb-7" pullRef={pullRef}>
          <BoardGridView />
        </GravityGestureLayer>
        <TeamWellGrid team={Team.One} />
      </View>

      {piecesToRender.map(([pid, piece]) => (
        <PieceView key={pid} id={pid} team={piece.team} />
      ))}

      {Object.keys(layout.slots).map((slotId) => (
        <SlotRim key={`slot-rim-${slotId}`} id={slotId} />
      ))}

      {hoverPreview && layout.spaces[hoverPreview.spaceId] ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: PIECE_RADIUS * 2,
            height: PIECE_RADIUS * 2,
            borderRadius: PIECE_RADIUS,
            borderWidth: 2,
            borderColor: colors.SLOT_BORDER_COLOR,
            backgroundColor:
              hoverPreview.team === Team.One
                ? colors.TEAM_ONE_COLOR
                : colors.TEAM_TWO_COLOR,
            opacity: 0.35,
            left:
              layout.spaces[hoverPreview.spaceId].pageX +
              layout.spaces[hoverPreview.spaceId].width / 2 -
              PIECE_RADIUS,
            top:
              layout.spaces[hoverPreview.spaceId].pageY +
              layout.spaces[hoverPreview.spaceId].height / 2 -
              PIECE_RADIUS,
            zIndex: 2500,
          }}
        />
      ) : null}

      {isPreviewingGravity && gravityPreviewBoard
        ? Object.entries(gravityPreviewBoard).map(([spaceId, pieceId]) => {
            const space = layout.spaces[spaceId];
            const piece = gameState.pieces[pieceId];
            if (!space || !piece) return null;
            return (
              <View
                key={`gravity-preview-${pieceId}-${spaceId}`}
                pointerEvents="none"
                style={{
                  position: "absolute",
                  width: PIECE_RADIUS * 2,
                  height: PIECE_RADIUS * 2,
                  borderRadius: PIECE_RADIUS,
                  borderWidth: 2,
                  borderColor: colors.SLOT_BORDER_COLOR,
                  backgroundColor:
                    piece.team === Team.One
                      ? colors.TEAM_ONE_COLOR
                      : colors.TEAM_TWO_COLOR,
                  opacity: 0.3,
                  left: space.pageX + space.width / 2 - PIECE_RADIUS,
                  top: space.pageY + space.height / 2 - PIECE_RADIUS,
                  zIndex: 2400,
                }}
              />
            );
          })
        : null}

      <WinOverlay
        visible={showWinOverlay && gameState.winner !== null}
        winner={gameState.winner === Team.One ? "teamOne" : "teamTwo"}
        onClose={() => setShowWinOverlay(false)}
      />
      <LoadingScreen visible={showLoadingScreen} />
    </View>
  );
};

export default GamePlay;
