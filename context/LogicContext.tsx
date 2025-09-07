import { Animations } from "@/constants";
import { PieceAnimation, usePieceAnimations } from "@/hooks/usePieceAnimations";
import { Team } from "@/types/board";
import {
  GameMode,
  GameState,
  PieceProps,
  PieceState,
  Turn,
} from "@/types/logic";
import findPieceRelationships from "@/utils/findPieceRelationships";
import setWinningPieces from "@/utils/setWinningPieces";
import React, { createContext, ReactNode, useContext, useState } from "react";
import { useLayout } from "./LayoutContext";

export type LogicContextType = {
  gameMode: GameMode;
  setGameMode: React.Dispatch<React.SetStateAction<GameMode>>;
  turnCount: number;
  currentTeam: Team;
  nextTurn: () => void;
  checkGameFinished: (updatedBoard: Record<string, string>) => void;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  winner: Team;
  setWinner: React.Dispatch<React.SetStateAction<Team>>;
  pieces: Record<string, PieceProps>;
  setPieces: React.Dispatch<React.SetStateAction<Record<string, PieceProps>>>;
  pieceAnimations: Record<string, PieceAnimation>;
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

  const { wells, layoutReady, setWellPieceLocations } = useLayout();
  const pieceAnimations = usePieceAnimations(); // now part of LogicContext

  const toPieces = (
    team: Team,
    startIdx: number,
    layout: Record<
      string,
      { pageX: number; pageY: number; width: number; height: number }
    >
  ): Record<string, PieceProps> => {
    const pieces: Record<string, PieceProps> = {};

    Object.entries(layout).forEach(([wellId], idx) => {
      const id = `${startIdx + idx}`;

      pieces[id] = {
        id,
        team,
        state: PieceState.inWell,
      };

      setWellPieceLocations((prev) => ({
        ...prev,
        [wellId]: id,
      }));
    });

    return pieces;
  };

  React.useEffect(() => {
    if (!layoutReady) return;

    const built = {
      ...toPieces(Team.TeamOne, 0, wells[Team.TeamOne]),
      ...toPieces(Team.TeamTwo, 24, wells[Team.TeamTwo]),
    };

    setPieces(built);
  }, [layoutReady, wells]);

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
      if (turn === 0) setGameState(GameState.Ready);
      else if (turn > 0) setGameState(GameState.Playing);
    }
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
      setPieces,
      animations: pieceAnimations,
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

  React.useEffect(() => gameCycle(turnCount + 1), [turnCount]);

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
        pieceAnimations, // exposed here
      }}
    >
      {children}
    </LogicContext.Provider>
  );
};

export const useLogic = () => {
  const context = useContext(LogicContext);
  if (!context) throw new Error("useLogic must be used within LogicProvider");
  return context;
};
