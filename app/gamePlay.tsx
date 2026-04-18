import { loadingScreenDismissDelayMs } from "@/animations/loadingAnimations";
import BackButton from "@/components/BackButton";
import BoardGridView from "@/components/BoardGridView";
import GravityGestureLayer from "@/components/GravityGestureLayer";
import LoadingScreen from "@/components/LoadingScreen";
import PieceView from "@/components/PieceView";
import SlotRim from "@/components/SlotRim";
import TeamWellGrid from "@/components/TeamWellGrid";
import TutorialStepBanner from "@/components/tutorial/TutorialStepBanner";
import WinOverlay from "@/components/WinOverlay";
import { PIECE_RADIUS, PIECE_WELL_SCALE } from "@/constants/gameElements";
import { WIN_OVERLAY_DELAY_MS } from "@/constants/logic";
import { PieceStatus, useGameSession } from "@/context/GameSessionContext";
import { useLayout } from "@/context/LayoutContext";
import { PlayfieldFrameProvider } from "@/context/PlayfieldFrameContext";
import { useSettings } from "@/context/SettingsContext";
import { useUi } from "@/context/UiContext";
import { getScenario } from "@/dev/scenarios";
import { runScriptedPlaceFromWell } from "@/dev/scriptedPlaceFromWell";
import { useScenarioPlayback } from "@/dev/useScenarioPlayback";
import { Direction, getSlotEntryDirection, Team } from "@/engine";
import {
  findTutorialBlackStackSlotAboveWhite,
  pickLowestBlackPieceIdInWells,
} from "@/tutorial/computeTutorialBlackStackSlot";
import { TUTORIAL_STEP_ONE_FOCUS_PIECE_ID } from "@/tutorial/gamePlayTutorialSteps";
import { useGamePlayTutorial } from "@/tutorial/useGamePlayTutorial";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useShake } from "@/hooks/useShake";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform, View } from "react-native";
import { withSpring } from "react-native-reanimated";
const GamePlay = () => {
  const router = useRouter();
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
    setMoveInProgressDelayed,
    setSlotDropHintActive,
    setTutorialWellPieceIdlePulseActive,
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
  const [showLoadingScreen, setShowLoadingScreen] = useState(
    () => !initialSkipLoadingOverlayFromTutorialUrl,
  );
  /** After first dismiss, do not flash loading when layout churns. */
  const loadingScreenDismissedOnceRef = useRef(
    initialSkipLoadingOverlayFromTutorialUrl,
  );
  const colors = theme.colorTheme;
  const textColor = colors.ODD_SPACE_COLOR;

  const pullRef = useRef<((direction: Direction) => void) | null>(null);
  /** Tutorial step 1 uses a sparse well map; step 2 fills the grid — bounce once. */
  const wellsWereSparseInTutorialRef = useRef(false);
  const didTutorialStepTwoWellFillBounceRef = useRef(false);
  const tutorialBlackStackDemoPlayedRef = useRef(false);
  const tutorialSecondBlackStackDemoPlayedRef = useRef(false);
  const tutorialFirstBlackSlotEntryRef = useRef<Direction | null>(null);
  const prevResolvedTutorialStepRef = useRef<string | undefined>(undefined);

  const installTutorialNearWinBoard = useCallback(() => {
    const scenario = getScenario("tutorialNearWin");
    if (!scenario) return;
    loadScenario(scenario);
    tutorialBlackStackDemoPlayedRef.current = false;
    tutorialSecondBlackStackDemoPlayedRef.current = false;
    tutorialFirstBlackSlotEntryRef.current = null;
    tutorialWhiteDropEntryDirectionRef.current = null;
  }, [loadScenario, tutorialWhiteDropEntryDirectionRef]);

  const installtutorialGravityNearWinBoard = useCallback(() => {
    const scenario = getScenario("tutorialGravityNearWin");
    if (!scenario) return;
    loadScenario(scenario);
    tutorialBlackStackDemoPlayedRef.current = false;
    tutorialSecondBlackStackDemoPlayedRef.current = false;
    tutorialFirstBlackSlotEntryRef.current = null;
    tutorialWhiteDropEntryDirectionRef.current = null;
  }, [loadScenario, tutorialWhiteDropEntryDirectionRef]);

  const installTutorialTightSpotBoard = useCallback(() => {
    const scenario = getScenario("tutorialTightSpot");
    if (!scenario) return;
    loadScenario(scenario);
    tutorialBlackStackDemoPlayedRef.current = false;
    tutorialSecondBlackStackDemoPlayedRef.current = false;
    tutorialFirstBlackSlotEntryRef.current = null;
    tutorialWhiteDropEntryDirectionRef.current = null;
  }, [loadScenario, tutorialWhiteDropEntryDirectionRef]);

  const finishTutorialAndPlay = useCallback(async () => {
    await newGame();
    router.replace("/gamePlay");
  }, [newGame, router]);

  const resetCurrentGameRef = useRef(resetCurrentGame);
  resetCurrentGameRef.current = resetCurrentGame;
  const onTutorialStep7ShakeReset = useCallback(() => {
    void resetCurrentGameRef.current();
  }, []);

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
      void resetCurrentGameRef.current();
    }, 4500);
    return () => clearTimeout(t);
  }, [scenarioParam, resolvedTutorialStepParam]);

  useEffect(() => {
    if (!scenarioParam?.startsWith("tutorial")) {
      wellsWereSparseInTutorialRef.current = false;
      didTutorialStepTwoWellFillBounceRef.current = false;
      tutorialBlackStackDemoPlayedRef.current = false;
      tutorialSecondBlackStackDemoPlayedRef.current = false;
      tutorialFirstBlackSlotEntryRef.current = null;
      tutorialWhiteDropEntryDirectionRef.current = null;
    }
  }, [scenarioParam, tutorialWhiteDropEntryDirectionRef]);

  useEffect(() => {
    if (
      scenarioParam?.startsWith("tutorial") &&
      resolvedTutorialStepParam === "1"
    ) {
      didTutorialStepTwoWellFillBounceRef.current = false;
      tutorialBlackStackDemoPlayedRef.current = false;
      tutorialSecondBlackStackDemoPlayedRef.current = false;
      tutorialFirstBlackSlotEntryRef.current = null;
    }
  }, [scenarioParam, resolvedTutorialStepParam]);

  /** Tutorial step 2+ (URL or in-place handoff) — do not show the loading overlay again. */
  const skipLoadingOverlayForTutorialHandoff = useMemo(() => {
    if (!scenarioParam?.startsWith("tutorial")) return false;
    return resolvedTutorialStepParam !== "1";
  }, [scenarioParam, resolvedTutorialStepParam]);

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
    const prev = prevResolvedTutorialStepRef.current;
    prevResolvedTutorialStepRef.current = resolvedTutorialStepParam;
    if (resolvedTutorialStepParam === "3" && prev === "2") {
      tutorialSecondBlackStackDemoPlayedRef.current = false;
    }
  }, [resolvedTutorialStepParam]);

  /** After step 2 wells settle, black stacks on white from a different edge than white used. */
  useEffect(() => {
    if (!scenarioParam?.startsWith("tutorial")) return;
    if (resolvedTutorialStepParam !== "2") return;
    if (!layout.layoutReady) return;
    if (Object.keys(wellPieceLocations).length < 40) return;
    if (
      pieceStatusMap[TUTORIAL_STEP_ONE_FOCUS_PIECE_ID] !== PieceStatus.onBoard
    ) {
      return;
    }
    if (gameState.currentTeam !== Team.Two) return;
    if (gameState.status !== "playing") return;
    if (tutorialBlackStackDemoPlayedRef.current) return;

    const whiteId = TUTORIAL_STEP_ONE_FOCUS_PIECE_ID;
    const slot = findTutorialBlackStackSlotAboveWhite(
      gameState.board,
      whiteId,
      tutorialWhiteDropEntryDirectionRef.current,
    );
    const blackId = pickLowestBlackPieceIdInWells(wellPieceLocations);
    if (!slot || !blackId) return;

    const delayMs = 950;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      tutorialBlackStackDemoPlayedRef.current = true;
      tutorialFirstBlackSlotEntryRef.current =
        getSlotEntryDirection(slot) ?? null;
      runScriptedPlaceFromWell({
        board: gameState.board,
        slotCoord: slot,
        pieceId: blackId,
        layout: { slots: layout.slots, spaces: layout.spaces },
        pieceAnims,
        setWellPieceLocations,
        setPieceStatusMap,
        setMoveInProgress,
        setMoveInProgressDelayed,
        dropPiece,
      });
    }, delayMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    scenarioParam,
    resolvedTutorialStepParam,
    layout.layoutReady,
    layout.slots,
    layout.spaces,
    wellPieceLocations,
    pieceStatusMap,
    gameState.board,
    gameState.currentTeam,
    gameState.status,
    pieceAnims,
    setWellPieceLocations,
    setPieceStatusMap,
    setMoveInProgress,
    setMoveInProgressDelayed,
    dropPiece,
    tutorialWhiteDropEntryDirectionRef,
  ]);

  /** After player's second drop (step 3), second scripted black before the win lesson. */
  useEffect(() => {
    if (!scenarioParam?.startsWith("tutorial")) return;
    if (resolvedTutorialStepParam !== "3") return;
    if (!layout.layoutReady) return;
    if (Object.keys(wellPieceLocations).length < 40) return;
    if (
      pieceStatusMap[TUTORIAL_STEP_ONE_FOCUS_PIECE_ID] !== PieceStatus.onBoard
    ) {
      return;
    }
    if (gameState.currentTeam !== Team.Two) return;
    if (gameState.status !== "playing") return;
    if (tutorialSecondBlackStackDemoPlayedRef.current) return;

    const whiteId = TUTORIAL_STEP_ONE_FOCUS_PIECE_ID;
    const slot = findTutorialBlackStackSlotAboveWhite(
      gameState.board,
      whiteId,
      tutorialFirstBlackSlotEntryRef.current,
    );
    const blackId = pickLowestBlackPieceIdInWells(wellPieceLocations);
    if (!slot || !blackId) return;

    const delayMs = 950;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      tutorialSecondBlackStackDemoPlayedRef.current = true;
      runScriptedPlaceFromWell({
        board: gameState.board,
        slotCoord: slot,
        pieceId: blackId,
        layout: { slots: layout.slots, spaces: layout.spaces },
        pieceAnims,
        setWellPieceLocations,
        setPieceStatusMap,
        setMoveInProgress,
        setMoveInProgressDelayed,
        dropPiece,
      });
    }, delayMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    scenarioParam,
    resolvedTutorialStepParam,
    layout.layoutReady,
    layout.slots,
    layout.spaces,
    wellPieceLocations,
    pieceStatusMap,
    gameState.board,
    gameState.currentTeam,
    gameState.status,
    pieceAnims,
    setWellPieceLocations,
    setPieceStatusMap,
    setMoveInProgress,
    setMoveInProgressDelayed,
    dropPiece,
  ]);

  useEffect(() => {
    if (!layout.layoutReady) {
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
  }, [layout.layoutReady, skipLoadingOverlayForTutorialHandoff]);

  // Reposition pieces whenever layout updates (wells or spaces register).
  // Runs every time a new cell registers, so pieces land at the right
  // positions even if wells register incrementally.
  useEffect(() => {
    const keyCount = Object.keys(wellPieceLocations).length;
    if (scenarioParam?.startsWith("tutorial") && keyCount < 15) {
      wellsWereSparseInTutorialRef.current = true;
    }

    const wellScale = PIECE_WELL_SCALE;
    const springConfig = {
      damping: 10,
      stiffness: 280,
      mass: 0.5,
    } as const;

    const shouldTutorialWellFillBounce =
      layout.layoutReady &&
      !!scenarioParam?.startsWith("tutorial") &&
      resolvedTutorialStepParam !== "1" &&
      !didTutorialStepTwoWellFillBounceRef.current &&
      keyCount >= 40 &&
      (wellsWereSparseInTutorialRef.current ||
        scenarioParam === "tutorialStep2");

    let ranTutorialWellFillBounce = false;

    Object.entries(wellPieceLocations).forEach(([wellId, pieceId]) => {
      if (pieceStatusMap[pieceId] === PieceStatus.onBoard) {
        return;
      }
      const wellLayout =
        layout.wells[Team.One]?.[wellId] ?? layout.wells[Team.Two]?.[wellId];
      const anim = pieceAnims[pieceId];
      if (!wellLayout || !anim) {
        return;
      }
      const targetX = wellLayout.pageX + wellLayout.width / 2 - PIECE_RADIUS;
      const targetY = wellLayout.pageY + wellLayout.height / 2 - PIECE_RADIUS;
      anim.translateX.value = targetX;
      anim.translateY.value = targetY;

      if (
        shouldTutorialWellFillBounce &&
        pieceStatusMap[pieceId] === PieceStatus.inWell
      ) {
        ranTutorialWellFillBounce = true;
        anim.scaleX.value = wellScale * 0.08;
        anim.scaleY.value = wellScale * 0.08;
        anim.scaleX.value = withSpring(wellScale, springConfig);
        anim.scaleY.value = withSpring(wellScale, springConfig);
      }
    });

    if (shouldTutorialWellFillBounce && ranTutorialWellFillBounce) {
      didTutorialStepTwoWellFillBounceRef.current = true;
      wellsWereSparseInTutorialRef.current = false;
    }

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
    layout.layoutReady,
    layout.wells,
    layout.spaces,
    wellPieceLocations,
    gameState.board,
    pieceAnims,
    pieceStatusMap,
    scenarioParam,
    resolvedTutorialStepParam,
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
