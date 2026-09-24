import { loadingScreenDismissDelayMs } from "@/animations/loadingAnimations";
import BackButton from "@/components/BackButton";
import BoardGridView from "@/components/BoardGridView";
import GravityGestureLayer from "@/components/GravityGestureLayer";
import LoadingScreen from "@/components/LoadingScreen";
import PieceView from "@/components/PieceView";
import SlotRim from "@/components/SlotRim";
import SurfaceGradient from "@/components/SurfaceGradient";
import TeamWellGrid from "@/components/TeamWellGrid";
import TutorialStepBanner from "@/components/tutorial/TutorialStepBanner";
import WinOverlay from "@/components/WinOverlay";
import { PIECE_RADIUS } from "@/constants/gameElements";
import { usePlayfieldAnimations, PLAYFIELD_ENTRANCE_READY_DELAY_MS, TUTORIAL_STEP_ONE_BANNER_READY_DELAY_MS } from "@/hooks/usePlayfieldAnimations";
import { WIN_OVERLAY_DELAY_MS } from "@/constants/logic";
import { PieceStatus, useGameSession } from "@/context/GameSessionContext";
import { useLayout } from "@/context/LayoutContext";
import { PlayfieldFrameProvider } from "@/context/PlayfieldFrameContext";
import { useSettings } from "@/context/SettingsContext";
import { useUi } from "@/context/UiContext";
import { getScenario } from "@/dev/scenarios";
import { useTutorialReplies } from "@/tutorial/useTutorialReplies";
import { useScenarioPlayback } from "@/dev/useScenarioPlayback";
import { Direction, Team } from "@/engine";
import { useGamePlayTutorial } from "@/tutorial/useGamePlayTutorial";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useShake } from "@/hooks/useShake";
import { useComputerOpponent } from "@/hooks/useComputerOpponent";
import { completeTutorial } from "@/storage";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform, Pressable, Text, View } from "react-native";
import Animated from "react-native-reanimated";

const WELL_CELLS_PER_TEAM = 24;
const PLAYABLE_SPACE_COUNT = 49;
const SLOT_COUNT = 28;
const CORNER_COUNT = 4;

const GamePlay = () => {
  const router = useRouter();
  const layout = useLayout();
  const {
    mode,
    moves, beginPieceDrag, returnPieceToWell, cancelPendingMoves,
    gameState,
    pieceStatusMap,
    wellPieceLocations,
    pieceAnims,
    dropPiece,
    loadScenario,
    newGame,
    resetCurrentGame,
    applyTutorialStepTwoWells,
    tutorialWhiteDropEntryDirectionRef,
    tieWinOverlayDelayMs,
  } = useGameSession();
  const {
    hoverPreview,
    isPreviewingGravity,
    gravityPreviewBoard,
    setMoveInProgress,
    setSlotDropHintActive,
    setTutorialWellPieceIdlePulseActive,
    setGravityPullEnabled,
    setTutorialPiecePickupLocked,
    tutorialBannerAttentionSignal,
    setTutorialInaccessibleSlotEntryDirection,
  } = useUi();
  const { theme } = useSettings();
  const { scenario: scenarioParam, tutorialStep: tutorialStepParam } =
    useLocalSearchParams<{
      scenario?: string;
      tutorialStep?: string;
    }>();

  const initialSkipLoadingOverlayFromTutorialUrl = useMemo(
    () =>
      !!scenarioParam?.startsWith("tutorial") &&
      (tutorialStepParam ?? "1") !== "1",
    [scenarioParam, tutorialStepParam],
  );

  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [computerEntranceReady, setComputerEntranceReady] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(
    () => !initialSkipLoadingOverlayFromTutorialUrl,
  );
  const [tutorialStepOneBannerReady, setTutorialStepOneBannerReady] = useState(
    () =>
      !(
        scenarioParam === "tutorialStep1" &&
        (tutorialStepParam ?? "1") === "1"
      ),
  );
  /** After first dismiss, do not flash loading when layout churns. */
  const loadingScreenDismissedOnceRef = useRef(
    initialSkipLoadingOverlayFromTutorialUrl,
  );
  const colors = theme.colorTheme;
  const textColor = colors.ODD_SPACE_COLOR;

  const pullRef = useRef<((direction: Direction) => void) | null>(null);

  const allPlayfieldCellsReady = useMemo(
    () =>
      Object.keys(layout.spaces).length >= PLAYABLE_SPACE_COUNT &&
      Object.keys(layout.slots).length >= SLOT_COUNT &&
      Object.keys(layout.corners).length >= CORNER_COUNT &&
      Object.keys(layout.wells[Team.One]).length >= WELL_CELLS_PER_TEAM &&
      Object.keys(layout.wells[Team.Two]).length >= WELL_CELLS_PER_TEAM,
    [layout.spaces, layout.slots, layout.corners, layout.wells],
  );

  const installTutorialNearWinBoard = useCallback(() => {
    const scenario = getScenario("tutorialNearWin");
    if (!scenario) return;
    loadScenario(scenario);
    tutorialWhiteDropEntryDirectionRef.current = null;
  }, [loadScenario, tutorialWhiteDropEntryDirectionRef]);

  const installtutorialGravityNearWinBoard = useCallback(() => {
    const scenario = getScenario("tutorialGravityNearWin");
    if (!scenario) return;
    loadScenario(scenario);
    tutorialWhiteDropEntryDirectionRef.current = null;
  }, [loadScenario, tutorialWhiteDropEntryDirectionRef]);

  const installTutorialTightSpotBoard = useCallback(() => {
    const scenario = getScenario("tutorialTightSpot");
    if (!scenario) return;
    loadScenario(scenario);
    tutorialWhiteDropEntryDirectionRef.current = null;
  }, [loadScenario, tutorialWhiteDropEntryDirectionRef]);

  const finishTutorialAndPlay = useCallback(async () => {
    await completeTutorial();
    await newGame();
    router.replace("/gamePlay");
  }, [newGame, router]);

  const onTutorialStep7ShakeReset = useCallback(() => {
    void resetCurrentGame();
  }, [resetCurrentGame]);

  const {
    showBanner: showTutorialBanner,
    bannerMessage: tutorialBannerMessage,
    resolvedTutorialStepParam,
  } = useGamePlayTutorial({
    scenarioParam,
    tutorialStepParam,
    pieceStatusMap,
    gameStateForTutorialBanner: gameState,
    applyTutorialStepTwoWells,
    installTutorialNearWinBoard,
    installtutorialGravityNearWinBoard,
    installTutorialTightSpotBoard,
    finishTutorialAndPlay,
    setSlotDropHintActive,
    setTutorialWellPieceIdlePulseActive,
  });
  const { boardEntranceStyle, teamTwoWellEntranceStyle, teamOneWellEntranceStyle,
    boardEntranceY, boardEntranceOpacity, teamTwoWellEntranceX, teamOneWellEntranceX, wellEntranceOpacity } =
    usePlayfieldAnimations({ allPlayfieldCellsReady, showLoadingScreen, scenarioParam, resolvedTutorialStepParam });
  const isTutorialStepOneIntro =
    scenarioParam === "tutorialStep1" && resolvedTutorialStepParam === "1";
  const isTutorialActive = !!scenarioParam?.startsWith("tutorial");
  const tutorialStepNumber = Number(resolvedTutorialStepParam);
  const tutorialBannerVisible =
    showTutorialBanner &&
    (!isTutorialStepOneIntro || tutorialStepOneBannerReady);

  useEffect(() => {
    if (!isTutorialStepOneIntro) {
      setTutorialStepOneBannerReady(true);
      return;
    }

    setTutorialStepOneBannerReady(false);
    if (showLoadingScreen || !allPlayfieldCellsReady) return;

    const timer = setTimeout(() => {
      setTutorialStepOneBannerReady(true);
    }, TUTORIAL_STEP_ONE_BANNER_READY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isTutorialStepOneIntro, showLoadingScreen, allPlayfieldCellsReady]);

  useEffect(() => {
    const gravityUnlocked =
      !isTutorialActive ||
      (Number.isFinite(tutorialStepNumber) && tutorialStepNumber >= 5);
    setGravityPullEnabled(gravityUnlocked);
    setTutorialPiecePickupLocked(
      isTutorialActive &&
        (resolvedTutorialStepParam === "5" ||
          resolvedTutorialStepParam === "6"),
    );

    return () => {
      setGravityPullEnabled(true);
      setTutorialPiecePickupLocked(false);
    };
  }, [
    isTutorialActive,
    tutorialStepNumber,
    resolvedTutorialStepParam,
    setGravityPullEnabled,
    setTutorialPiecePickupLocked,
  ]);

  useEffect(() => {
    const blockedEntryDirection =
      isTutorialActive && resolvedTutorialStepParam === "2"
        ? tutorialWhiteDropEntryDirectionRef.current
        : null;
    setTutorialInaccessibleSlotEntryDirection(blockedEntryDirection);

    return () => setTutorialInaccessibleSlotEntryDirection(null);
  }, [
    isTutorialActive,
    resolvedTutorialStepParam,
    setTutorialInaccessibleSlotEntryDirection,
    tutorialWhiteDropEntryDirectionRef,
  ]);

  useShake({
    enabled:
      !!scenarioParam?.startsWith("tutorial") &&
      resolvedTutorialStepParam === "7",
    onShake: onTutorialStep7ShakeReset,
  });

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (!scenarioParam?.startsWith("tutorial")) return;
    if (resolvedTutorialStepParam !== "7") return;
    const t = setTimeout(() => {
      void resetCurrentGame();
    }, 4500);
    return () => clearTimeout(t);
  }, [scenarioParam, resolvedTutorialStepParam, resetCurrentGame]);

  /** Tutorial step 2+ (URL or in-place handoff) — do not show the loading overlay again. */
  const skipLoadingOverlayForTutorialHandoff = useMemo(() => {
    if (!scenarioParam?.startsWith("tutorial")) return false;
    return resolvedTutorialStepParam !== "1";
  }, [scenarioParam, resolvedTutorialStepParam]);

  useEffect(() => () => cancelPendingMoves(), [cancelPendingMoves]);

  useScenarioPlayback({
    moves, beginPieceDrag, returnPieceToWell,
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
    dropPiece,
    setMoveInProgress,
    pullRef,
  });

  useTutorialReplies(scenarioParam, resolvedTutorialStepParam);
  useEffect(() => {
    if (mode !== "onePlayer" || scenarioParam || showLoadingScreen || !allPlayfieldCellsReady) return;
    const timer = setTimeout(() => setComputerEntranceReady(true), PLAYFIELD_ENTRANCE_READY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [mode, scenarioParam, showLoadingScreen, allPlayfieldCellsReady]);
  const { blocked: computerBlocked } = useComputerOpponent(
    !scenarioParam && !showLoadingScreen && allPlayfieldCellsReady && computerEntranceReady,
    pullRef,
  );

  useEffect(() => {
    if (!allPlayfieldCellsReady) {
      if (
        !skipLoadingOverlayForTutorialHandoff &&
        !loadingScreenDismissedOnceRef.current
      ) {
        setShowLoadingScreen(true);
      }
      return;
    }
    const timer = setTimeout(() => {
      setShowLoadingScreen(false);
      loadingScreenDismissedOnceRef.current = true;
    }, loadingScreenDismissDelayMs);
    return () => clearTimeout(timer);
  }, [allPlayfieldCellsReady, skipLoadingOverlayForTutorialHandoff]);

  const piecesToRender = useMemo(() => {
    const pieceIdsInWells = new Set(Object.values(wellPieceLocations));
    return Object.entries(gameState.pieces).filter(([pid]) => {
      const status = pieceStatusMap[pid] ?? PieceStatus.inWell;
      return status !== PieceStatus.inWell || pieceIdsInWells.has(pid);
    });
  }, [gameState.pieces, pieceStatusMap, wellPieceLocations]);

  useEffect(() => {
    if (
      gameState.status !== "finished" ||
      (!gameState.winner && !gameState.tie)
    ) {
      setShowWinOverlay(false);
      return;
    }
    if (
      scenarioParam?.startsWith("tutorial") &&
      resolvedTutorialStepParam === "4" &&
      gameState.winner === Team.One &&
      !gameState.tie
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
    scenarioParam,
    resolvedTutorialStepParam,
  ]);

  return (
    <View
      className="flex-1 flex-col items-center justify-center"
      style={{ backgroundColor: theme.colorTheme.FELT_TOP }}
    >
      <SurfaceGradient />
      {mode === "onePlayer" && !scenarioParam && gameState.status === "playing" ? (
        <Text accessibilityLiveRegion="polite" style={{ position: "absolute", bottom: 46, left: 24, color: textColor, zIndex: 10 }}>
          {gameState.currentTeam === Team.One ? "Your turn · lower pieces" :
            computerBlocked ? "Computer has no permitted move" : "Computer is thinking…"}
        </Text>
      ) : null}
      {computerBlocked ? (
        <Pressable accessibilityRole="button" onPress={() => { void resetCurrentGame(); }} style={{ position: "absolute", bottom: 76, left: 12, padding: 12, zIndex: 10 }}>
          <Text style={{ color: textColor, textDecorationLine: "underline" }}>Start a new game</Text>
        </Pressable>
      ) : null}
      <BackButton
        variant="inline"
        textStyle={{ color: textColor }}
        imageStyle={{ tintColor: textColor }}
        style={{
          position: "absolute",
          bottom: 35,
          right: 24,
          borderColor: colors.SLOT_BORDER_COLOR,
          backgroundColor: colors.WELL_BG_COLOR_TWO,
          borderWidth: 1,
        }}
      />
      <PlayfieldFrameProvider>
        <View className="flex-col items-center justify-center">
          <Animated.View style={teamTwoWellEntranceStyle}>
            <TeamWellGrid team={Team.Two} />
          </Animated.View>
          <Animated.View style={boardEntranceStyle}>
            <GravityGestureLayer className="mt-7 mb-7" pullRef={pullRef}>
              <BoardGridView />
            </GravityGestureLayer>
          </Animated.View>
          <Animated.View style={teamOneWellEntranceStyle}>
            <TeamWellGrid team={Team.One} />
          </Animated.View>
        </View>

        {piecesToRender.map(([pid, piece]) => {
          const status = pieceStatusMap[pid];
          const isBoardPiece =
            status === PieceStatus.onBoard || status === PieceStatus.winner;
          const entranceOpacity = isBoardPiece
            ? boardEntranceOpacity
            : wellEntranceOpacity;
          const entranceTranslateX = isBoardPiece
            ? undefined
            : piece.team === Team.One
              ? teamOneWellEntranceX
              : teamTwoWellEntranceX;
          const entranceTranslateY = isBoardPiece
            ? boardEntranceY
            : undefined;

          return (
            <PieceView
              key={pid}
              id={pid}
              team={piece.team}
              entranceOpacity={entranceOpacity}
              entranceTranslateX={entranceTranslateX}
              entranceTranslateY={entranceTranslateY}
            />
          );
        })}

        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
            boardEntranceStyle,
          ]}
        >
          {Object.keys(layout.slots).map((slotId) => (
            <SlotRim key={`slot-rim-${slotId}`} id={slotId} />
          ))}
        </Animated.View>

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
        visible={tutorialBannerVisible}
        message={tutorialBannerMessage}
        textColor={textColor}
        slotBorderColor={colors.SLOT_BORDER_COLOR}
        wellBgColor={colors.WELL_BG_COLOR_TWO}
        attentionSignal={tutorialBannerAttentionSignal}
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
