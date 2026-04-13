import type { Coord, EngineResult, GameState, NearWin } from "@/engine";
import {
  coordToKey,
  createGame,
  detectNearWins,
  Direction,
  placePiece as enginePlacePiece,
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
import { PieceAnimation } from "@/types/animation";
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
import { makeMutable } from "react-native-reanimated";

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
  const [gameState, setGameState] = useState<GameState>(createGame);
  const [pieceStatusMap, setPieceStatusMap] = useState<PieceStatusMap>(
    buildInitialPieceStatusMap,
  );
  const [wellPieceLocations, setWellPieceLocations] = useState<
    Record<string, string>
  >(buildInitialWellPieceLocations);
  const pieceAnimsRef =
    useRef<Record<string, PieceAnimation>>(buildPieceAnims());

  const nearWins = useMemo(
    () => detectNearWins(gameState.board, gameState.pieces),
    [gameState.board, gameState.pieces],
  );

  const nextTurnWins = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const nw of nearWins) {
      map[coordToKey(nw.emptyCoord)] = true;
    }
    return map;
  }, [nearWins]);

  const dropPiece = useCallback(
    (slotCoord: Coord, pieceId: string): EngineResult => {
      const result = enginePlacePiece(gameState, slotCoord, pieceId);
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
    setGameState(createGame());
    setPieceStatusMap(buildInitialPieceStatusMap());
    setWellPieceLocations(buildInitialWellPieceLocations());
    await clearSession();
  }, []);

  const resetCurrentGame = useCallback(async () => {
    setGameState(engineResetGame());
    setPieceStatusMap(buildInitialPieceStatusMap());
    setWellPieceLocations(buildInitialWellPieceLocations());
    await clearSession();
  }, []);

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
