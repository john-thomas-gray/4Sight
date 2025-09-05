import { Animations } from "@/constants";
import { PieceProps, Team } from "@/types/board";
import findPieceRelationships from "@/utils/findPieceRelationships";
import setWinningPieces from "@/utils/setWinningPieces";
import React, {
  createContext,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from "react";
import { GameMode, GameState, Turn } from "../types/logic";

export type LogicContextType = {
  gameMode: GameMode;
  setGameMode: React.Dispatch<React.SetStateAction<GameMode>>;
  turnCount: number;
  currentTeam: Team;
  nextTurn: () => void;
  checkGameFinished: (updatedBoard: Record<string, string>) => void;
  gameState: GameState;
  setGameState: React.Dispatch<SetStateAction<GameState>>;
  winner: Team;
  setWinner: React.Dispatch<React.SetStateAction<Team>>;
  pieces: Record<string, PieceProps>;
  setPieces: React.Dispatch<React.SetStateAction<Record<string, PieceProps>>>;
};

const LogicContext = createContext<LogicContextType | undefined>(undefined);

export const LogicProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.TwoPlayer);
  const [playersTurn, setPlayersTurn] = useState<1 | 2 | 3 | 4>(1);
  const [turnCount, setTurnCount] = useState<number>(0);
  const [gameState, setGameState] = useState<GameState>(GameState.PreGame);
  const [winner, setWinner] = useState<Team>(Team.Unassigned);
  const [pieces, setPieces] = useState<Record<string, PieceProps>>({});

  const logicalStrategies: Record<
    string,
    {
      getNextTurn: (currentTurn: Turn) => Turn;
      team: (currentTurn: Turn) => Team;
    }
  > = {
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

  const gameCycle = (turn: number) => {
    if (gameState !== GameState.Playing && gameState !== GameState.Finished) {
      if (turn === 0) {
        setGameState(GameState.Ready);
      } else if (turn > 0) {
        setGameState(GameState.Playing);
      }
    }
    return gameState;
  };

  const checkGameFinished = (
    updatedBoardPieceLocations: Record<string, string>
  ) => {
    const pieceRelationships = findPieceRelationships({
      boardPieceLocations: updatedBoardPieceLocations,
      winLen: 4,
      allPieces: pieces,
    });
    setWinningPieces({
      partials: pieceRelationships.partials,
      winners: pieceRelationships.winners,
      winNextTurns: pieceRelationships.winNextTurns,
      setPieces,
    });
    const teamOneWins =
      Object.keys(pieceRelationships.winners.teamOne).length > 0;
    const teamTwoWins =
      Object.keys(pieceRelationships.winners.teamTwo).length > 0;
    const bothTeamsWin = teamOneWins && teamTwoWins;

    const winnerTeam = bothTeamsWin
      ? Team.Both
      : teamOneWins
      ? Team.TeamOne
      : teamTwoWins
      ? Team.TeamTwo
      : Team.Unassigned;

    if (winnerTeam !== Team.Unassigned) {
      setWinner(winnerTeam);
      setGameState(GameState.Finished);
    } else {
      setTimeout(() => nextTurn(), Animations.BOARD_COLOR_CHANGE_DURATION);
    }
  };

  // Run game cycle whenever turnCount or gameMode changes
  React.useEffect(() => {
    gameCycle(turnCount + 1);
  }, [turnCount]);

  return (
    <LogicContext.Provider
      value={{
        gameMode,
        setGameMode,
        turnCount,
        currentTeam,
        nextTurn,
        checkGameFinished,
        gameState,
        setGameState,
        winner,
        setWinner,
        pieces,
        setPieces,
      }}
    >
      {children}
    </LogicContext.Provider>
  );
};

export const useLogicContext = () => {
  const context = useContext(LogicContext);
  if (!context)
    throw new Error("useLogicContext must be used within LogicProvider");
  return context;
};
