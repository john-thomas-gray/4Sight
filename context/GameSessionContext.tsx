import type { Coord, EngineResult, GameState, NearWin } from "@/engine";
import {
  coordToKey,
  createGame,
  detectWin,
  detectNearWins,
  Direction,
  findSlotForSpace,
  placePiece as enginePlacePiece,
  Team,
  resetGame as engineResetGame,
  shiftGravity as engineShiftGravity,
  PIECES_PER_TEAM,
} from "@/engine";
import type { PersistedSessionState } from "@/storage";
import {
  clearSession,
  gameStateToSerializable,
  saveSession,
  serializableToGameState,
} from "@/storage";
import { PieceAnimation, RETURN_TO_WELL } from "@/types/animation";
import { animateWinnerPiece } from "@/animations/animateWinner";
import { useSettings } from "@/context/SettingsContext";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLayout } from "./LayoutContext";
import { Easing, makeMutable, withTiming } from "react-native-reanimated";

export enum PieceStatus {
  inWell = "inWell",
  isHeld = "isHeld",
  onBoard = "onBoard",
  winner = "winner",
}

export type PieceStatusMap = Record<string, PieceStatus>;

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

export function buildInitialWellPieceLocations(): Record<string, string> {
  const map: Record<string, string> = {};
  let pieceNum = 0;
  for (let c = 9; c <= 11; c++) {
    for (let r = 9; r <= 16; r++) {
      map[`${r}-${c}`] = String(pieceNum++);
    }
  }
  for (let c = 12; c <= 14; c++) {
    for (let r = 17; r <= 24; r++) {
      map[`${r}-${c}`] = String(pieceNum++);
    }
  }
  return map;
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

  useEffect(() => {
    if (gameState.status !== "finished" || !gameState.winner) return;
    setNextStartingTeam(gameState.winner);
  }, [gameState.status, gameState.winner]);

  useEffect(() => {
    return () => {
      if (resetCommitTimeoutRef.current) clearTimeout(resetCommitTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (gameState.status !== "finished" || !gameState.winner) {
      winnerCascadeKeyRef.current = null;
      return;
    }

    const winResult = detectWin(gameState.board, gameState.pieces);
    const winningLine = winResult.lines.find((line) => {
      const first = line.pieceIds[0];
      return first && gameState.pieces[first]?.team === gameState.winner;
    });
    if (!winningLine) return;

    const cascadeIds = Array.from(new Set(winningLine.pieceIds));
    const cascadeKey = `${gameState.turnCount}:${cascadeIds.join(",")}`;
    if (winnerCascadeKeyRef.current === cascadeKey) return;
    winnerCascadeKeyRef.current = cascadeKey;
    cascadeIds.forEach((pieceId, idx) => {
      const anim = pieceAnimsRef.current[pieceId];
      if (anim) {
        animateWinnerPiece(anim, idx * 140);
      }
    });
    setPieceStatusMap((prev) => {
      const next = { ...prev };
      for (const pieceId of cascadeIds) {
        next[pieceId] = PieceStatus.winner;
      }
      return next;
    });
  }, [gameState.status, gameState.winner, gameState.turnCount, gameState.board, gameState.pieces]);

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
      const hasWinEvent = result.events.some((e) => e.type === "game_won");
      if (hasWinEvent) {
        const winningDropEvent = result.events.find(
          (e): e is Extract<(typeof result.events)[number], { type: "piece_placed" }> =>
            e.type === "piece_placed",
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
      const keepWinnerColor = winningDropPieceIdsRef.current.has(pieceId);
      const teamDefaultColor =
        piece.team === Team.One
          ? theme.colorTheme.TEAM_ONE_COLOR
          : theme.colorTheme.TEAM_TWO_COLOR;

      const targetX =
        targetWellLayout.pageX + targetWellLayout.width / 2 - 16;
      const targetY =
        targetWellLayout.pageY + targetWellLayout.height / 2 - 16;

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
      anim.translateX.value = withTiming(
        targetX,
        {
          duration: 500,
          easing: Easing.inOut(Easing.quad),
        },
        () => {
          anim.scaleX.value = 1.1;
          anim.scaleY.value = 1.1;
          anim.zIndex.value = 500;
        },
      );
      anim.translateY.value = withTiming(targetY, {
        duration: 500,
        easing: Easing.inOut(Easing.quad),
      });
    }

    if (resetCommitTimeoutRef.current) clearTimeout(resetCommitTimeoutRef.current);
    await new Promise<void>((resolve) => {
      resetCommitTimeoutRef.current = setTimeout(() => {
        resetCommitTimeoutRef.current = null;
        resolve();
      }, Math.max(500, RETURN_TO_WELL));
    });

    const base = engineResetGame();
    setGameState({ ...base, currentTeam: nextStartingTeam });
    setPieceStatusMap(buildInitialPieceStatusMap());
    setWellPieceLocations(initialWellMap);
    await clearSession();
  }, [
    gameState.board,
    gameState.pieces,
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

  // Auto-save game state after every turn change
  const turnCountRef = useRef(gameState.turnCount);
  useEffect(() => {
    if (gameState.turnCount === turnCountRef.current) return;
    turnCountRef.current = gameState.turnCount;

    const session: PersistedSessionState = {
      game: gameStateToSerializable(gameState),
      pieceStatusMap,
      wellPieceLocations,
    };
    saveSession(session);
  }, [gameState, pieceStatusMap, wellPieceLocations]);

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
