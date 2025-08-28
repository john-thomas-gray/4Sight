import { Animations } from "@/constants";
import { CLASSIC, ColorThemeType } from "@/constants/colorThemes";
import {
  CellLayout,
  CellProps,
  CellType,
  PieceProps,
  Team,
  WellState,
} from "@/types/board";
import { loadAppState, saveAppState } from "@/utils/useAsyncStorage";
import { xInARow } from "@/utils/xInARow";
import {
  createContext,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { GameMode, GameState, Turn, Winner } from "../types/logic";

type GameContextType = {
  layout: {
    wells: Record<Team, Record<string, CellLayout>>;
    spaces: Record<string, CellLayout>;
    corners: Record<string, CellLayout>;
    slots: Record<string, CellLayout>;
    // Need pieces
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
    winner: Winner;
    setWinner: React.Dispatch<React.SetStateAction<Winner>>;
  };
  settings: {
    colorTheme: ColorThemeType;
    setColorTheme: React.Dispatch<React.SetStateAction<ColorThemeType>>;
  };
};

type TurnStrategy = {
  getNextTurn: (currentTurn: Turn) => Turn;
  team: (currentTurn: Turn) => Team;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  // Async Cache
  useEffect(() => {
    const loadState = async () => {
      const saved = await loadAppState();

      if (saved.theme) {
        setColorTheme(saved.theme);
      }

      // if (saved.boardPieceLocations) {
      //   setBoardPieceLocations(saved.boardPieceLocations);
      // }

      // if (saved.wellPieceLocations) {
      //   setWellPieceLocations(saved.wellPieceLocations);
      // }
    };

    loadState();
  }, []);

  // ** Layout ** //

  const [wells, setWells] = useState<WellState>({
    [Team.TeamOne]: {},
    [Team.TeamTwo]: {},
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
  const [winner, setWinner] = useState<Winner>(Winner.Null);

  // Broken AF
  const gameCycle = (turn: number) => {
    if (gameState !== GameState.Playing && gameState !== GameState.Finished) {
      if (turn === 0) {
        setGameState(GameState.Ready);
      } else if (turn > 0) {
        setGameState(GameState.Playing);
      }
    }
    console.log(gameState);
    return gameState;
  };

  const checkGameFinished = (
    updatedBoardPieceLocations: typeof boardPieceLocations
  ) => {
    const winnerCheck = xInARow(updatedBoardPieceLocations, 4);
    if (!winnerCheck) {
      setTimeout(() => nextTurn(), Animations.BOARD_COLOR_CHANGE_DURATION);
    } else if (typeof winnerCheck === "string") {
      console.log("Winner found!", winnerCheck);
      setWinner(winner);
      setGameState(GameState.Finished);
    }
  };

  useEffect(() => {
    gameCycle(turnCount + 1);
  }, [turnCount, gameMode]);

  // ** Settings ** //

  const [colorTheme, setColorTheme] = useState<ColorThemeType>(CLASSIC);

  useEffect(() => {
    saveAppState({ theme: colorTheme });
  }, [colorTheme]);

  // useEffect(() => {
  //   console.log("turn changed");
  //   saveAppState({ boardPieceLocations });
  //   saveAppState({ wellPieceLocations });
  // }, [turnCount]);

  // useEffect(() => {
  //   console.log(boardPieceLocations);
  //   console.log("check X", checkXInARow(boardPieceLocations, 3));
  // }, [boardPieceLocations]);

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
        settings: {
          colorTheme,
          setColorTheme,
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
