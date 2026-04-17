import { loadingScreenDismissDelayMs } from "@/animations/loadingAnimations";
import BackButton from "@/components/BackButton";
import BoardGridView from "@/components/BoardGridView";
import GravityGestureLayer from "@/components/GravityGestureLayer";
import LoadingScreen from "@/components/LoadingScreen";
import PieceView from "@/components/PieceView";
import SlotRim from "@/components/SlotRim";
import TeamWellGrid from "@/components/TeamWellGrid";
import WinOverlay from "@/components/WinOverlay";
import { PIECE_RADIUS } from "@/constants/gameElements";
import { WIN_OVERLAY_DELAY_MS } from "@/constants/logic";
import { PieceStatus, useGameSession } from "@/context/GameSessionContext";
import { useScenarioPlayback } from "@/dev/useScenarioPlayback";
import { useLayout } from "@/context/LayoutContext";
import { PlayfieldFrameProvider } from "@/context/PlayfieldFrameContext";
import { useSettings } from "@/context/SettingsContext";
import { useUi } from "@/context/UiContext";
import { Direction, Team } from "@/engine";
import TutorialStepBanner from "@/components/tutorial/TutorialStepBanner";
import { useGamePlayTutorial } from "@/tutorial/useGamePlayTutorial";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
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
    tieWinOverlayDelayMs,
  } = useGameSession();
  const {
    hoverPreview,
    isPreviewingGravity,
    gravityPreviewBoard,
    setMoveInProgress,
    setMoveInProgressDelayed,
    setSlotDropHintActive,
  } = useUi();
  const { theme } = useSettings();
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const colors = theme.colorTheme;
  const textColor = colors.ODD_SPACE_COLOR;

  const { scenario: scenarioParam, tutorialStep: tutorialStepParam } =
    useLocalSearchParams<{
      scenario?: string;
      tutorialStep?: string;
    }>();
  const pullRef = useRef<((direction: Direction) => void) | null>(null);

  const { showBanner: showTutorialBanner, bannerMessage: tutorialBannerMessage } =
    useGamePlayTutorial({
      scenarioParam,
      tutorialStepParam,
      pieceStatusMap,
      setSlotDropHintActive,
    });

  useScenarioPlayback({
    scenarioParam,
    showLoadingScreen,
    gameState: {
      board: gameState.board,
      status: gameState.status,
      turnCount: gameState.turnCount,
    },
    loadScenario,
    layout: { slots: layout.slots, spaces: layout.spaces },
    pieceAnims,
    setWellPieceLocations,
    setPieceStatusMap,
    dropPiece,
    setMoveInProgress,
    setMoveInProgressDelayed,
    pullRef,
  });

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
    if (
      gameState.status !== "finished" ||
      (!gameState.winner && !gameState.tie)
    ) {
      setShowWinOverlay(false);
      return;
    }
    if (gameState.tie) {
      const delayMs = tieWinOverlayDelayMs;
      if (delayMs == null) return;
      const timer = setTimeout(() => setShowWinOverlay(true), delayMs);
      return () => clearTimeout(timer);
    }
    const winnerCount = Object.values(pieceStatusMap).filter(
      (s) => s === PieceStatus.winner,
    ).length;
    if (winnerCount === 0) return;
    const timer = setTimeout(
      () => setShowWinOverlay(true),
      WIN_OVERLAY_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [
    gameState.status,
    gameState.winner,
    gameState.tie,
    pieceStatusMap,
    tieWinOverlayDelayMs,
  ]);

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
      <PlayfieldFrameProvider>
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
      </PlayfieldFrameProvider>

      <TutorialStepBanner
        visible={showTutorialBanner}
        message={tutorialBannerMessage}
        textColor={textColor}
        slotBorderColor={colors.SLOT_BORDER_COLOR}
        wellBgColor={colors.WELL_BG_COLOR_TWO}
      />

      <WinOverlay
        visible={showWinOverlay && (gameState.winner !== null || gameState.tie)}
        winner={
          gameState.tie
            ? "tie"
            : gameState.winner === Team.One
              ? "teamOne"
              : "teamTwo"
        }
        onClose={() => setShowWinOverlay(false)}
      />
      <LoadingScreen visible={showLoadingScreen} />
    </View>
  );
};

export default GamePlay;
