import { TEAM_ONE_COLOR, TEAM_TWO_COLOR } from "@/constants/gameElements";
import { CellLayout, CellProps } from "@/types/board";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { GameMode, Team, Turn } from "../types/logic";

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
};

type TurnStrategy = {
  getNextTurn: (currentTurn: Turn) => Turn;
  team: (currentTurn: Turn) => Team;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [wells, setWells] = useState<{
    [TEAM_ONE_COLOR]: Record<string, CellLayout>;
    [TEAM_TWO_COLOR]: Record<string, CellLayout>;
  }>({ [TEAM_ONE_COLOR]: {}, [TEAM_TWO_COLOR]: {} });
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
    Object.keys(wells[TEAM_ONE_COLOR]).length > 0 &&
    Object.keys(wells[TEAM_TWO_COLOR]).length > 0;

  const registerCell = useCallback(({ id, team, type, layout }: CellProps) => {
    if (type === "slot") {
      setSlots((prev) => ({
        ...prev,
        [id]: layout!,
      }));
    } else if (type === "space") {
      setSpaces((prev) => ({
        ...prev,
        [id]: layout!,
      }));
    } else if (type === "well" && team) {
      setWells((prev) => ({
        ...prev,
        [team]: {
          ...prev[team],
          [id]: layout!,
        },
      }));
    } else if (type === "corner") {
      setCorners((prev) => ({
        ...prev,
        [id]: layout!,
      }));
    } else {
      throw new Error("registerCell: unknown cell type");
    }
  }, []);

  // TURN RULES
  const [playersTurn, setPlayersTurn] = useState<1 | 2 | 3 | 4>(1);
  const [turnCount, setTurnCount] = useState<number>(1);
  const [gameMode, setGameMode] = useState<GameMode>("twoPlayer");

  const turnStrategies: Record<string, TurnStrategy> = {
    twoPlayer: {
      getNextTurn: (currentTurn) => (currentTurn === 1 ? 2 : 1),
      team: (currentTurn) =>
        currentTurn === 1 ? TEAM_ONE_COLOR : TEAM_TWO_COLOR,
    },
    fourPlayer: {
      getNextTurn: (currentTurn) => ((currentTurn % 4) + 1) as Turn,
      team: (currentTurn) =>
        currentTurn % 2 === 0 ? TEAM_TWO_COLOR : TEAM_ONE_COLOR,
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
