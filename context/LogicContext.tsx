import { animateWinner } from "@/animations/pieceAnimations";
import { Animations, Logic } from "@/constants";
import { WINNER_BASE_DELAY } from "@/constants/animations";
import { PieceAnimation, usePieceAnimations } from "@/hooks/usePieceAnimations";
import { Team } from "@/types/board";
import {
  GameMode,
  GameState,
  PieceProps,
  PieceStatus,
  PieceStatusMap
} from "@/types/logic";
import findPieceRelationships, { BoardPiece, BoardPieces } from "@/utils/findPieceRelationships";
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
  pieceStatusMap: PieceStatusMap;
  setPieceStatusMap: React.Dispatch<React.SetStateAction<PieceStatusMap>>
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
  const pieceAnimations = usePieceAnimations();

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

  const initialPieceStatusMap: PieceStatusMap = {};
  for (let i = 0; i < 48; i++) {
    initialPieceStatusMap[i.toString()] = PieceStatus.inWell;
  }
  const [pieceStatusMap, setPieceStatusMap] = useState<PieceStatusMap>({});

  // const logicalStrategies: Record<
  //   string,
  //   {
  //     getNextTurn: (currentTurn: Turn) => Turn;
  //     team: (currentTurn: Turn) => Team;
  //   }
  // > = {
  //   twoPlayer: {
  //     getNextTurn: (currentTurn) => (currentTurn === 1 ? 2 : 1),
  //     team: (currentTurn) => (currentTurn === 1 ? Team.TeamOne : Team.TeamTwo),
  //   },
  //   fourPlayer: {
  //     getNextTurn: (currentTurn) => ((currentTurn % 4) + 1) as Turn,
  //     team: (currentTurn) =>
  //       currentTurn % 2 === 0 ? Team.TeamTwo : Team.TeamOne,
  //   },
  // };

  /* Look into logical strategies for implementing two game modes */
  const getNextPlayersTurn = (currentTurn: number): 1 | 2 | 3 |4 => {

    return ((currentTurn % 4) + 1) as 1 | 2 | 3 | 4;

  };

  // THIS WILL NOT WORK
  const nextTurn = () => {
    setPlayersTurn(getNextPlayersTurn(playersTurn));
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
      winLen: Logic.WIN_LENGTH,
      allPieces: pieces,
    });

    type SetWinningPieces = {
      partials: Pick<Record<Team, BoardPieces[]>, Team.TeamOne | Team.TeamTwo>;
      winners: Pick<Record<Team, BoardPieces[]>, Team.TeamOne | Team.TeamTwo>;
      setPieces: React.Dispatch<
        React.SetStateAction<Record<string, PieceProps>>
      >;
      animations: Record<string, PieceAnimation>;
    };

    function setWinningPieces({
      partials,
      winners,
      setPieces,
      animations,
    }: SetWinningPieces) {
      const updatePieceStatus = (
        groups: BoardPieces[],
        pieceStatus: PieceStatus
      ) => {
        const pieceAnims = animations;
        let baseDelay = WINNER_BASE_DELAY;

        groups.forEach((group) => {
          group.forEach((boardPiece: BoardPiece, idx) => {
            const delay = baseDelay + idx * 300; // stagger each piece
            setTimeout(() => {
              setPieceStatusMap((prev) => ({
                ...prev,
                [boardPiece.pieceId]: pieceStatus,
              }));
              animateWinner({
                ...pieceAnims[boardPiece.pieceId],
              });
            }, delay);
          });
          baseDelay += group.length * 100; // increment baseDelay for next group
        });
      };

      const winnersOne = winners.teamOne;
      const winnersTwo = winners.teamTwo;
      // const partialsOne = partials.teamOne;
      // const partialsTwo = partials.teamTwo;

      updatePieceStatus(winnersOne, PieceStatus.winner);
      updatePieceStatus(winnersTwo, PieceStatus.winner);
      // updatePieceStatus(partialsOne, PieceStatus.partial);
      // updatePieceStatus(partialsTwo, PieceStatus.partial);
    }
    // console.log("pieceR", pieceRelationships)

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
        pieceAnimations,
        pieceStatusMap,
        setPieceStatusMap,
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
