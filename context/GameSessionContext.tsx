import { useSettings } from "@/context/SettingsContext";
import type { Scenario, ScenarioMove } from "@/dev/scenarios";
import type { Coord, EngineResult, GameState, NearWin } from "@/engine";
import {
  coordToKey,
  createGame,
  detectNearWins,
  Direction,
  placePiece as enginePlacePiece,
  resetGame as engineResetGame,
  shiftGravity as engineShiftGravity,
  findSlotForSpace,
  PIECES_PER_TEAM,
  Team,
  computeTieWinOverlayDelayMs,
} from "@/engine";
import type { PersistedSessionState } from "@/storage";
import { clearSession, serializableToGameState } from "@/storage";
import { buildInitialWellPieceLocations } from "@/constants/wells";
import {
  PieceAnimation,
  RESET_TO_WELL_BEAT_MS,
  RESET_TO_WELL_HOVER_DY,
  RESET_TO_WELL_LOWER_MS,
  RESET_TO_WELL_RISE_DY,
  RESET_TO_WELL_RISE_MS,
  RESET_TO_WELL_TOTAL_MS,
  RESET_TO_WELL_ZIP_MS,
} from "@/types/animation";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Easing,
  makeMutable,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { PieceStatus, type PieceStatusMap } from "@/types/pieceStatus";
import { useLayout } from "./LayoutContext";
import { useGameSessionSideEffects } from "./useGameSessionSideEffects";

export { PieceStatus, type PieceStatusMap };

type GameSessionContextType = {
  gameState: GameState;
  pieceStatusMap: PieceStatusMap;
  setPieceStatusMap: React.Dispatch<React.SetStateAction<PieceStatusMap>>;
  wellPieceLocations: Record<string, string>;
  setWellPieceLocations: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  nearWins: NearWin[];
  nextTurnWins: Record<string, boolean>;
  pieceAnims: Record<string, PieceAnimation>;
  dropPiece: (slotCoord: Coord, pieceId: string) => EngineResult;
  shiftGravity: (direction: Direction) => EngineResult;
  newGame: () => Promise<void>;
  resetCurrentGame: () => Promise<void>;
  continueGame: (session: PersistedSessionState) => void;
  loadScenario: (scenario: Scenario) => ScenarioMove[];
  /** Milliseconds until tie modal should show (both cascades done); null when not a tie. */
  tieWinOverlayDelayMs: number | null;
};

const GameSessionContext = createContext<GameSessionContextType | undefined>(
  undefined,
);

function buildInitialPieceStatusMap(): PieceStatusMap {
  const map: PieceStatusMap = {};
  for (let i = 0; i < PIECES_PER_TEAM * 2; i++) {
    map[String(i)] = PieceStatus.inWell;
  }
  return map;
}

function buildPieceAnims(): Record<string, PieceAnimation> {
  const anims: Record<string, PieceAnimation> = {};
  for (let i = 0; i < PIECES_PER_TEAM * 2; i++) {
    const id = String(i);
    anims[id] = {
      translateX: makeMutable(0),
      translateY: makeMutable(0),
      scaleX: makeMutable(1.1),
      scaleY: makeMutable(1.1),
      color: makeMutable(i < PIECES_PER_TEAM ? "#ffffff" : "#000000"),
      winnerColor: makeMutable(i < PIECES_PER_TEAM ? "#fdffd0ff" : "#967d00ff"),
      zIndex: makeMutable(500),
    };
  }
  return anims;
}

export const GameSessionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const layout = useLayout();
  const { theme } = useSettings();
  const [gameState, setGameState] = useState<GameState>(createGame);
  const [nextStartingTeam, setNextStartingTeam] = useState<Team>(Team.One);
  const [pieceStatusMap, setPieceStatusMap] = useState<PieceStatusMap>(
    buildInitialPieceStatusMap,
  );
  const [wellPieceLocations, setWellPieceLocations] = useState<
    Record<string, string>
  >(buildInitialWellPieceLocations);
  const pieceAnimsRef =
    useRef<Record<string, PieceAnimation>>(buildPieceAnims());
  const resetCommitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const winnerCascadeKeyRef = useRef<string | null>(null);
  const winningDropPieceIdsRef = useRef<Set<string>>(new Set());

  const nearWins = useMemo(
    () => detectNearWins(gameState.board, gameState.pieces),
    [gameState.board, gameState.pieces],
  );

  const tieWinOverlayDelayMs = useMemo(() => {
    if (gameState.status !== "finished" || !gameState.tie) return null;
    return computeTieWinOverlayDelayMs(
      gameState.board,
      gameState.pieces,
      gameState.currentTeam,
      [...winningDropPieceIdsRef.current],
    );
  }, [
    gameState.status,
    gameState.tie,
    gameState.board,
    gameState.pieces,
    gameState.currentTeam,
    gameState.turnCount,
  ]);

  useGameSessionSideEffects({
    gameState,
    pieceStatusMap,
    wellPieceLocations,
    setPieceStatusMap,
    setNextStartingTeam,
    pieceAnimsRef,
    winnerCascadeKeyRef,
    winningDropPieceIdsRef,
    resetCommitTimeoutRef,
  });

  const nextTurnWins = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (gameState.status !== "playing") return map;
    for (const nw of nearWins) {
      const reachableSlot = findSlotForSpace(gameState.board, nw.emptyCoord);
      if (reachableSlot) {
        map[coordToKey(nw.emptyCoord)] = true;
      }
    }
    return map;
  }, [nearWins, gameState.status, gameState.board]);

  const dropPiece = useCallback(
    (slotCoord: Coord, pieceId: string): EngineResult => {
      const result = enginePlacePiece(gameState, slotCoord, pieceId);
      const endedGame = result.events.some(
        (e) => e.type === "game_won" || e.type === "game_tied",
      );
      if (endedGame) {
        const winningDropEvent = result.events.find(
          (
            e,
          ): e is Extract<
            (typeof result.events)[number],
            { type: "piece_placed" }
          > => e.type === "piece_placed",
        );
        if (winningDropEvent) {
          winningDropPieceIdsRef.current.add(winningDropEvent.pieceId);
        }
      }
      if (result.events.length > 0) {
        setGameState(result.state);
      }
      return result;
    },
    [gameState],
  );

  const shiftGravity = useCallback(
    (direction: Direction): EngineResult => {
      const result = engineShiftGravity(gameState, direction);
      if (result.state !== gameState) {
        if (result.state.status === "finished") {
          const grav = result.events.find(
            (e): e is Extract<
              (typeof result.events)[number],
              { type: "gravity_shifted" }
            > => e.type === "gravity_shifted",
          );
          const winEv = result.events.find(
            (e): e is Extract<
              (typeof result.events)[number],
              { type: "game_won" | "game_tied" }
            > => e.type === "game_won" || e.type === "game_tied",
          );
          if (grav && winEv) {
            const onWinningLine = new Set<string>();
            for (const line of winEv.lines) {
              for (const pid of line.pieceIds) onWinningLine.add(pid);
            }
            for (const m of grav.moves) {
              if (onWinningLine.has(m.pieceId)) {
                winningDropPieceIdsRef.current.add(m.pieceId);
              }
            }
          }
        }
        setGameState(result.state);
      }
      return result;
    },
    [gameState],
  );

  const newGame = useCallback(async () => {
    const base = createGame();
    setGameState({ ...base, currentTeam: nextStartingTeam });
    setPieceStatusMap(buildInitialPieceStatusMap());
    setWellPieceLocations(buildInitialWellPieceLocations());
    await clearSession();
  }, [nextStartingTeam]);

  const resetCurrentGame = useCallback(async () => {
    const initialWellMap = buildInitialWellPieceLocations();
    const pieceToWellId = Object.entries(initialWellMap).reduce<
      Record<string, string>
    >((acc, [wellId, pieceId]) => {
      acc[pieceId] = wellId;
      return acc;
    }, {});

    const boardPieceIds = Object.values(gameState.board);
    for (const pieceId of boardPieceIds) {
      const targetWellId = pieceToWellId[pieceId];
      const piece = gameState.pieces[pieceId];
      const targetWellLayout =
        piece && targetWellId ? layout.wells[piece.team]?.[targetWellId] : null;
      const anim = pieceAnimsRef.current[pieceId];
      if (!anim || !targetWellLayout) continue;
      const keepWinnerColor =
        !gameState.tie && winningDropPieceIdsRef.current.has(pieceId);
      const teamDefaultColor =
        piece.team === Team.One
          ? theme.colorTheme.TEAM_ONE_COLOR
          : theme.colorTheme.TEAM_TWO_COLOR;

      const targetX = targetWellLayout.pageX + targetWellLayout.width / 2 - 16;
      const targetY = targetWellLayout.pageY + targetWellLayout.height / 2 - 16;

      const startX = anim.translateX.value;
      const startY = anim.translateY.value;
      const riseY = startY - RESET_TO_WELL_RISE_DY;
      const hoverY = targetY - RESET_TO_WELL_HOVER_DY;
      const zipEase = Easing.inOut(Easing.cubic);

      anim.scaleX.value = 1.5;
      anim.scaleY.value = 1.5;
      anim.zIndex.value = 5000;
      anim.color.value = withTiming(
        keepWinnerColor ? anim.winnerColor.value : teamDefaultColor,
        {
          duration: 240,
          easing: Easing.inOut(Easing.quad),
        },
      );
      anim.translateX.value = withSequence(
        withTiming(startX, { duration: RESET_TO_WELL_RISE_MS }),
        withTiming(startX, { duration: RESET_TO_WELL_BEAT_MS }),
        withTiming(targetX, {
          duration: RESET_TO_WELL_ZIP_MS,
          easing: zipEase,
        }),
        withTiming(targetX, { duration: RESET_TO_WELL_BEAT_MS }),
        withTiming(targetX, { duration: RESET_TO_WELL_LOWER_MS }),
      );
      anim.translateY.value = withSequence(
        withTiming(riseY, {
          duration: RESET_TO_WELL_RISE_MS,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(riseY, { duration: RESET_TO_WELL_BEAT_MS }),
        withTiming(hoverY, {
          duration: RESET_TO_WELL_ZIP_MS,
          easing: zipEase,
        }),
        withTiming(hoverY, { duration: RESET_TO_WELL_BEAT_MS }),
        withTiming(targetY, {
          duration: RESET_TO_WELL_LOWER_MS,
          easing: Easing.out(Easing.quad),
        }, (finished) => {
          if (!finished) return;
          anim.scaleX.value = 1.1;
          anim.scaleY.value = 1.1;
          anim.zIndex.value = 500;
        }),
      );
    }

    if (resetCommitTimeoutRef.current)
      clearTimeout(resetCommitTimeoutRef.current);
    await new Promise<void>((resolve) => {
      resetCommitTimeoutRef.current = setTimeout(
        () => {
          resetCommitTimeoutRef.current = null;
          resolve();
        },
        Math.max(500, RESET_TO_WELL_TOTAL_MS),
      );
    });

    const base = engineResetGame();
    setGameState({ ...base, currentTeam: nextStartingTeam });
    setPieceStatusMap(buildInitialPieceStatusMap());
    setWellPieceLocations(initialWellMap);
    await clearSession();
  }, [
    gameState.board,
    gameState.pieces,
    gameState.tie,
    layout.wells,
    nextStartingTeam,
    theme.colorTheme.TEAM_ONE_COLOR,
    theme.colorTheme.TEAM_TWO_COLOR,
  ]);

  const continueGame = useCallback((session: PersistedSessionState) => {
    setGameState(serializableToGameState(session.game));
    setPieceStatusMap(session.pieceStatusMap as PieceStatusMap);
    setWellPieceLocations(session.wellPieceLocations);
  }, []);

  const loadScenario = useCallback((scenario: Scenario): ScenarioMove[] => {
    const base = createGame();
    setGameState({
      ...base,
      board: scenario.board,
      currentTeam: scenario.currentTeam,
    });

    const boardPieceIds = new Set(Object.values(scenario.board));

    const statusMap: PieceStatusMap = {};
    for (let i = 0; i < PIECES_PER_TEAM * 2; i++) {
      const id = String(i);
      statusMap[id] = boardPieceIds.has(id)
        ? PieceStatus.onBoard
        : PieceStatus.inWell;
    }
    setPieceStatusMap(statusMap);

    let wells: Record<string, string>;
    if (scenario.wellPieceLocations) {
      wells = { ...scenario.wellPieceLocations };
      for (const pieceId of boardPieceIds) {
        for (const [wellId, pid] of Object.entries(wells)) {
          if (pid === pieceId) delete wells[wellId];
        }
      }
    } else {
      wells = buildInitialWellPieceLocations();
      for (const [wellId, pieceId] of Object.entries(wells)) {
        if (boardPieceIds.has(pieceId)) {
          delete wells[wellId];
        }
      }
    }
    setWellPieceLocations(wells);

    return [...scenario.moves];
  }, []);

  const value = useMemo<GameSessionContextType>(
    () => ({
      gameState,
      pieceStatusMap,
      setPieceStatusMap,
      wellPieceLocations,
      setWellPieceLocations,
      nearWins,
      nextTurnWins,
      pieceAnims: pieceAnimsRef.current,
      dropPiece,
      shiftGravity,
      newGame,
      resetCurrentGame,
      continueGame,
      loadScenario,
      tieWinOverlayDelayMs,
    }),
    [
      gameState,
      pieceStatusMap,
      wellPieceLocations,
      nearWins,
      nextTurnWins,
      dropPiece,
      shiftGravity,
      newGame,
      resetCurrentGame,
      continueGame,
      loadScenario,
      tieWinOverlayDelayMs,
    ],
  );

  return (
    <GameSessionContext.Provider value={value}>
      {children}
    </GameSessionContext.Provider>
  );
};

export const useGameSession = () => {
  const ctx = useContext(GameSessionContext);
  if (!ctx)
    throw new Error("useGameSession must be used within GameSessionProvider");
  return ctx;
};
