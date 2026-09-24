import { PIECE_RADIUS, PIECE_WELL_SCALE } from "@/constants/gameElements";
import { PieceStatus, useGameSession } from "@/context/GameSessionContext";
import { useLayout } from "@/context/LayoutContext";
import { Team } from "@/engine";
import { useEffect, useRef } from "react";
import { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
const BOARD_ENTRANCE_START_Y = -420;
const TEAM_TWO_WELL_ENTRANCE_START_X = -420;
const TEAM_ONE_WELL_ENTRANCE_START_X = 420;
const WELL_ENTRANCE_DELAY_MS = 520;
const WELL_ENTRANCE_DURATION_MS = 520;
const PIECE_SPROUT_DELAY_MS = WELL_ENTRANCE_DELAY_MS + WELL_ENTRANCE_DURATION_MS - 60;
export const PLAYFIELD_ENTRANCE_READY_DELAY_MS = PIECE_SPROUT_DELAY_MS + 380;
export const TUTORIAL_STEP_ONE_BANNER_READY_DELAY_MS = PLAYFIELD_ENTRANCE_READY_DELAY_MS;
export function usePlayfieldAnimations({
  allPlayfieldCellsReady,
  showLoadingScreen,
  scenarioParam,
  resolvedTutorialStepParam
}: {
  allPlayfieldCellsReady: boolean;
  showLoadingScreen: boolean;
  scenarioParam?: string;
  resolvedTutorialStepParam?: string;
}) {
  const layout = useLayout();
  const {
    gameState,
    wellPieceLocations,
    pieceAnims,
    pieceStatusMap,
    positionRevision
  } = useGameSession();
  const positioned = useRef<{
    spaces: typeof layout.spaces;
    wells: typeof layout.wells;
    revision: number;
    pieceWells: Record<string, string>;
  } | null>(null);
  const wellsWereSparseInTutorialRef = useRef(false);
  const didTutorialStepTwoWellFillBounceRef = useRef(false);
  const didRunPageEntranceRef = useRef(false);
  const didRunInitialWellSproutRef = useRef(false);
  const boardEntranceY = useSharedValue(0);
  const boardEntranceOpacity = useSharedValue(1);
  const teamTwoWellEntranceX = useSharedValue(0);
  const teamOneWellEntranceX = useSharedValue(0);
  const wellEntranceOpacity = useSharedValue(1);
  const boardEntranceStyle = useAnimatedStyle(() => ({
    opacity: boardEntranceOpacity.value,
    transform: [{
      translateY: boardEntranceY.value
    }]
  }));
  const teamTwoWellEntranceStyle = useAnimatedStyle(() => ({
    opacity: wellEntranceOpacity.value,
    transform: [{
      translateX: teamTwoWellEntranceX.value
    }]
  }));
  const teamOneWellEntranceStyle = useAnimatedStyle(() => ({
    opacity: wellEntranceOpacity.value,
    transform: [{
      translateX: teamOneWellEntranceX.value
    }]
  }));
  useEffect(() => {
    if (!scenarioParam?.startsWith("tutorial")) {
      wellsWereSparseInTutorialRef.current = false;
      didTutorialStepTwoWellFillBounceRef.current = false;
    }
  }, [scenarioParam]);
  useEffect(() => {
    if (scenarioParam?.startsWith("tutorial") && resolvedTutorialStepParam === "1") {
      didTutorialStepTwoWellFillBounceRef.current = false;
    }
  }, [scenarioParam, resolvedTutorialStepParam]);
  useEffect(() => {
    if (!allPlayfieldCellsReady || showLoadingScreen) return;
    if (didRunPageEntranceRef.current) return;
    didRunPageEntranceRef.current = true;
    boardEntranceY.set(BOARD_ENTRANCE_START_Y);
    boardEntranceOpacity.set(0);
    teamTwoWellEntranceX.set(TEAM_TWO_WELL_ENTRANCE_START_X);
    teamOneWellEntranceX.set(TEAM_ONE_WELL_ENTRANCE_START_X);
    wellEntranceOpacity.set(0);
    boardEntranceOpacity.set(withTiming(1, {
      duration: 130
    }));
    boardEntranceY.set(withSpring(0, {
      damping: 15,
      stiffness: 130,
      mass: 0.9
    }));
    wellEntranceOpacity.set(withDelay(WELL_ENTRANCE_DELAY_MS, withTiming(1, {
      duration: 150
    })));
    teamTwoWellEntranceX.set(withDelay(WELL_ENTRANCE_DELAY_MS, withTiming(0, {
      duration: WELL_ENTRANCE_DURATION_MS,
      easing: Easing.out(Easing.cubic)
    })));
    teamOneWellEntranceX.set(withDelay(WELL_ENTRANCE_DELAY_MS, withTiming(0, {
      duration: WELL_ENTRANCE_DURATION_MS,
      easing: Easing.out(Easing.cubic)
    })));
  }, [allPlayfieldCellsReady, showLoadingScreen, boardEntranceOpacity, boardEntranceY, teamOneWellEntranceX, teamTwoWellEntranceX, wellEntranceOpacity]);

  // Reposition pieces whenever layout updates (wells or spaces register).
  // Runs every time a new cell registers, so pieces land at the right
  // positions even if wells register incrementally.
  useEffect(() => {
    const prior = positioned.current;
    const boardGeometryChanged = prior?.spaces !== layout.spaces || prior?.revision !== positionRevision;
    const wellGeometryChanged = prior?.wells !== layout.wells || prior?.revision !== positionRevision;
    const currentWells = Object.fromEntries(Object.entries(wellPieceLocations).map(([well, id]) => [id, well]));
    const keyCount = Object.keys(wellPieceLocations).length;
    if (scenarioParam?.startsWith("tutorial") && keyCount < 15) {
      wellsWereSparseInTutorialRef.current = true;
    }
    const wellScale = PIECE_WELL_SCALE;
    const springConfig = {
      damping: 10,
      stiffness: 280,
      mass: 0.5
    } as const;
    const shouldTutorialWellFillBounce = layout.layoutReady && !!scenarioParam?.startsWith("tutorial") && resolvedTutorialStepParam !== "1" && !didTutorialStepTwoWellFillBounceRef.current && keyCount >= 40 && (wellsWereSparseInTutorialRef.current || scenarioParam === "tutorialStep2");
    const shouldInitialWellSprout = allPlayfieldCellsReady && !showLoadingScreen && !didRunInitialWellSproutRef.current;
    const sproutSpringConfig = {
      damping: 8,
      stiffness: 260,
      mass: 0.55
    } as const;
    let ranTutorialWellFillBounce = false;
    let ranInitialWellSprout = false;
    Object.entries(wellPieceLocations).forEach(([wellId, pieceId]) => {
      if (pieceStatusMap[pieceId] !== PieceStatus.inWell) {
        return;
      }
      const wellLayout = layout.wells[Team.One]?.[wellId] ?? layout.wells[Team.Two]?.[wellId];
      const anim = pieceAnims[pieceId];
      if (!wellLayout || !anim) {
        return;
      }
      const targetX = wellLayout.pageX + wellLayout.width / 2 - PIECE_RADIUS;
      const targetY = wellLayout.pageY + wellLayout.height / 2 - PIECE_RADIUS;
      if (wellGeometryChanged || prior?.pieceWells[pieceId] !== wellId) {
        anim.translateX.set(targetX);
        anim.translateY.set(targetY);
        anim.scaleX.set(wellScale);
        anim.scaleY.set(wellScale);
      }
      if (shouldInitialWellSprout && pieceStatusMap[pieceId] === PieceStatus.inWell) {
        ranInitialWellSprout = true;
        anim.scaleX.set(wellScale * 0.04);
        anim.scaleY.set(wellScale * 0.04);
        anim.scaleX.set(withDelay(PIECE_SPROUT_DELAY_MS, withSpring(wellScale, sproutSpringConfig)));
        anim.scaleY.set(withDelay(PIECE_SPROUT_DELAY_MS, withSpring(wellScale, sproutSpringConfig)));
      } else if (shouldTutorialWellFillBounce && pieceStatusMap[pieceId] === PieceStatus.inWell) {
        ranTutorialWellFillBounce = true;
        anim.scaleX.set(wellScale * 0.08);
        anim.scaleY.set(wellScale * 0.08);
        anim.scaleX.set(withSpring(wellScale, springConfig));
        anim.scaleY.set(withSpring(wellScale, springConfig));
      }
    });
    if (shouldTutorialWellFillBounce && ranTutorialWellFillBounce) {
      didTutorialStepTwoWellFillBounceRef.current = true;
      wellsWereSparseInTutorialRef.current = false;
    }
    if (shouldInitialWellSprout && ranInitialWellSprout) {
      didRunInitialWellSproutRef.current = true;
    }
    Object.entries(gameState.board).forEach(([spaceId, pieceId]) => {
      const spaceLayout = layout.spaces[spaceId];
      const anim = pieceAnims[pieceId];
      if (spaceLayout && anim && boardGeometryChanged) {
        anim.translateX.set(spaceLayout.pageX + spaceLayout.width / 2 - PIECE_RADIUS);
        anim.translateY.set(spaceLayout.pageY + spaceLayout.height / 2 - PIECE_RADIUS);
        anim.scaleX.set(1);
        anim.scaleY.set(1);
      }
    });
    positioned.current = {
      spaces: layout.spaces,
      wells: layout.wells,
      revision: positionRevision,
      pieceWells: currentWells
    };
  }, [positionRevision, layout.layoutReady, layout.wells, layout.spaces, wellPieceLocations, gameState.board, pieceAnims, pieceStatusMap, scenarioParam, resolvedTutorialStepParam, allPlayfieldCellsReady, showLoadingScreen]);
  return {
    boardEntranceStyle,
    teamTwoWellEntranceStyle,
    teamOneWellEntranceStyle,
    boardEntranceY,
    boardEntranceOpacity,
    teamTwoWellEntranceX,
    teamOneWellEntranceX,
    wellEntranceOpacity
  };
}
