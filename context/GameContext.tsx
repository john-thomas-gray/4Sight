import { Animations } from "@/constants";
import {
  CellLayout,
  CellProps,
  CellType,
  PieceProps,
  Team,
} from "@/types/board";
import findPieceRelationships from "@/utils/findPieceRelationships";
import {
  createContext,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { GameMode, GameState, Turn } from "../types/logic";

export type GameContextType = {
  layout: {
    wells: Record<Team, Record<string, CellLayout>>;
    spaces: Record<string, CellLayout>;
    corners: Record<string, CellLayout>;
    slots: Record<string, CellLayout>;
    wellPieceLocations: Record<string, string>;
    boardPieceLocations: Record<string, string>;
    registerCell: ({ id, type, team, layout }: CellProps) => void;
    setWellPieceLocations: React.Dispatch<
      React.SetStateAction<Record<string, string>>
    >;
    setBoardPieceLocations: React.Dispatch<
      React.SetStateAction<Record<string, string>>
    >;
    currentBoardId?: string | null;
    layoutReady: boolean;
    pieces: Record<string, PieceProps>;
    setPieces: React.Dispatch<React.SetStateAction<Record<string, PieceProps>>>;
  };
  logic: {
    gameMode: GameMode;
    turnCount: number;
    currentTeam: Team;
    setGameMode: React.Dispatch<React.SetStateAction<GameMode>>;
    checkGameFinished: (updatedBoard: Record<string, string>) => void;
    gameState: GameState;
    setGameState: React.Dispatch<SetStateAction<GameState>>;
    winner: Team;
    setWinner: React.Dispatch<React.SetStateAction<Team>>;
  };
};
export type Layout = GameContextType["layout"];

type TurnStrategy = {
  getNextTurn: (currentTurn: Turn) => Turn;
  team: (currentTurn: Turn) => Team;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  // ** Layout ** //

  const [wells, setWells] = useState<Record<Team, Record<string, CellLayout>>>({
    [Team.TeamOne]: {},
    [Team.TeamTwo]: {},
    [Team.Both]: {},
    [Team.Unassigned]: {},
  });
  const [spaces, setSpaces] = useState<Record<string, CellLayout>>({});
  const [slots, setSlots] = useState<Record<string, CellLayout>>({});
  const [corners, setCorners] = useState<Record<string, CellLayout>>({});
  const [pieces, setPieces] = useState<Record<string, PieceProps>>({});

  // Merge these to pieceLocations well and in play
  const [wellPieceLocations, setWellPieceLocations] = useState<
    Record<string, string>
  >({});
  const [boardPieceLocations, setBoardPieceLocations] = useState<
    Record<string, string>
  >({});

  const layoutReady =
    Object.keys(slots).length > 0 &&
    Object.keys(spaces).length > 0 &&
    Object.keys(corners).length > 0 &&
    Object.keys(wells[Team.TeamOne]).length > 0 &&
    Object.keys(wells[Team.TeamTwo]).length > 0;

  const registerCell = useCallback(({ id, team, type, layout }: CellProps) => {
    if (!layout) return;

    switch (type) {
      case CellType.Slot:
        setSlots((prev) => ({ ...prev, [id]: layout }));
        break;

      case CellType.Space:
        setSpaces((prev) => ({ ...prev, [id]: layout }));
        break;

      case CellType.Well:
        if (!team) throw new Error("Well must have a team");
        setWells((prev) => ({
          ...prev,
          [team]: {
            ...prev[team],
            [id]: layout,
          },
        }));
        break;

      case CellType.Corner:
        setCorners((prev) => ({ ...prev, [id]: layout }));
        break;

      default:
        throw new Error(`registerCell: unknown type "${type}"`);
    }
  }, []);

  // ** Logic ** //

  const [gameMode, setGameMode] = useState<GameMode>(GameMode.TwoPlayer);

  const [playersTurn, setPlayersTurn] = useState<1 | 2 | 3 | 4>(1);

  const [turnCount, setTurnCount] = useState<number>(0);

  const logicalStrategies: Record<string, TurnStrategy> = {
    twoPlayer: {
      getNextTurn: (currentTurn) => (currentTurn === 1 ? 2 : 1),
      team: (currentTurn) => (currentTurn === 1 ? Team.TeamOne : Team.TeamTwo),
    },
    fourPlayer: {
      getNextTurn: (currentTurn) => ((currentTurn % 4) + 1) as Turn,
      team: (currentTurn) =>
        currentTurn % 2 === 0 ? Team.TeamTwo : Team.TeamOne,
    },
  };

  const nextTurn = () => {
    const strategy = logicalStrategies[gameMode];
    setPlayersTurn(strategy.getNextTurn(playersTurn));
    setTurnCount((prev) => prev + 1);
  };

  const currentTeam = logicalStrategies[gameMode].team(playersTurn);

  const [gameState, setGameState] = useState<GameState>(GameState.PreGame);
  const [winner, setWinner] = useState<Team>(Team.Unassigned);

  // Broken AF
  const gameCycle = (turn: number) => {
    if (gameState !== GameState.Playing && gameState !== GameState.Finished) {
      if (turn === 0) {
        setGameState(GameState.Ready);
      } else if (turn > 0) {
        setGameState(GameState.Playing);
      }
    }
    // console.log(gameState);
    return gameState;
  };

  const checkGameFinished = (
    updatedBoardPieceLocations: typeof boardPieceLocations
  ) => {
    const pieceRelationships = findPieceRelationships({
      boardPieceLocations,
      winLen: 4,
      allPieces: pieces,
    });
    const teamOneWins =
      Object.keys(pieceRelationships.winners.teamOne).length > 0;
    const teamTwoWins =
      Object.keys(pieceRelationships.winners.teamTwo).length > 0;
    const bothTeamsWin = teamOneWins && teamTwoWins;

    const winner = bothTeamsWin
      ? Team.Both
      : teamOneWins
      ? Team.TeamOne
      : teamTwoWins
      ? Team.TeamTwo
      : Team.Unassigned;

    if (winner !== Team.Unassigned) {
      console.log("Winner found!", winner);
      setWinner(winner);
      setGameState(GameState.Finished);
    } else {
      setTimeout(() => nextTurn(), Animations.BOARD_COLOR_CHANGE_DURATION);
    }
  };

  useEffect(() => {
    setTimeout(
      () => checkGameFinished(boardPieceLocations),
      Animations.SLOT_TO_SPACE_DURATION
    );
  }, [boardPieceLocations]);

  useEffect(() => {
    gameCycle(turnCount + 1);
  }, [turnCount, gameMode]);

  return (
    <GameContext.Provider
      value={{
        layout: {
          wells,
          spaces,
          slots,
          corners,
          registerCell,
          wellPieceLocations,
          setWellPieceLocations,
          boardPieceLocations,
          setBoardPieceLocations,
          layoutReady,
          pieces,
          setPieces,
        },
        logic: {
          gameMode,
          checkGameFinished,
          turnCount,
          currentTeam,
          setGameMode,
          winner,
          setWinner,
          gameState,
          setGameState,
        },
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameContext must be used within GameProvider");
  }
  return context;
};
