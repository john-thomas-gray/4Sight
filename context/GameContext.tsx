import { CLASSIC, ColorTheme } from "@/constants/colorThemes";
import { CellLayout, CellProps, Team, WellState } from "@/types/board";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { GameMode, Turn } from "../types/logic";

type GameContextType = {
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
  };
  logic: {
    gameMode: GameMode;
    nextTurn: () => void;
    turnCount: number;
    currentTeam: Team;
    setGameMode: React.Dispatch<React.SetStateAction<GameMode>>;
  };
  settings: {
    colorTheme: ColorTheme;
    setColorTheme: React.Dispatch<React.SetStateAction<ColorTheme>>;
  };
};

type TurnStrategy = {
  getNextTurn: (currentTurn: Turn) => Turn;
  team: (currentTurn: Turn) => Team;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [colorTheme, setColorTheme] = useState<ColorTheme>(CLASSIC);
  const [wells, setWells] = useState<WellState>({
    teamOne: {},
    teamTwo: {},
  });
  const [spaces, setSpaces] = useState<Record<string, CellLayout>>({});
  const [slots, setSlots] = useState<Record<string, CellLayout>>({});
  const [corners, setCorners] = useState<Record<string, CellLayout>>({});

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
    Object.keys(wells.teamOne).length > 0 &&
    Object.keys(wells.teamTwo).length > 0;

  const registerCell = useCallback(({ id, team, type, layout }: CellProps) => {
    if (!layout) return;

    switch (type) {
      case "slot":
        setSlots((prev) => ({ ...prev, [id]: layout }));
        break;

      case "space":
        setSpaces((prev) => ({ ...prev, [id]: layout }));
        break;

      case "well":
        if (!team) throw new Error("Well must have a team");
        setWells((prev) => ({
          ...prev,
          [team]: {
            ...prev[team],
            [id]: layout,
          },
        }));
        break;

      case "corner":
        setCorners((prev) => ({ ...prev, [id]: layout }));
        break;

      default:
        throw new Error(`registerCell: unknown type "${type}"`);
    }
  }, []);

  // TURN RULES
  const [playersTurn, setPlayersTurn] = useState<1 | 2 | 3 | 4>(1);
  const [turnCount, setTurnCount] = useState<number>(1);
  const [gameMode, setGameMode] = useState<GameMode>("twoPlayer");

  const turnStrategies: Record<string, TurnStrategy> = {
    twoPlayer: {
      getNextTurn: (currentTurn) => (currentTurn === 1 ? 2 : 1),
      team: (currentTurn) => (currentTurn === 1 ? "teamOne" : "teamTwo"),
    },
    fourPlayer: {
      getNextTurn: (currentTurn) => ((currentTurn % 4) + 1) as Turn,
      team: (currentTurn) => (currentTurn % 2 === 0 ? "teamTwo" : "teamOne"),
    },
  };

  const nextTurn = () => {
    const strategy = turnStrategies[gameMode];
    setPlayersTurn(strategy.getNextTurn(playersTurn));
    setTurnCount((prev) => prev + 1);
    console.log("next turn. it is now turn:", turnCount);
  };

  const currentTeam = turnStrategies[gameMode].team(playersTurn);

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
        },
        logic: {
          gameMode,
          nextTurn,
          turnCount,
          currentTeam,
          setGameMode,
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
