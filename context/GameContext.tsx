import { CellTeam } from "@/types/board";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

type CellRegisterProps = {
  id: string;
  type: "space" | "slot" | "well" | "corner" | "error";
  team?: CellTeam;
  layout: Layout;
};

type GameContextType = {
  wells: {
    white: Record<string, Layout>;
    black: Record<string, Layout>;
  };
  spaces: Record<string, Layout>;
  corners: Record<string, Layout>;
  slots: Record<string, Layout>;
  wellPieceLocations: Record<string, string>;
  boardPieceLocations: Record<string, string>;
  registerCell: ({ id, type, team, layout }: CellRegisterProps) => void;
  setWellPieceLocations: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  setBoardPieceLocations: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  currentBoardId?: string | null;
  layoutReady: boolean;
  gameMode: GameMode;
  nextTurn: () => void;
};

type GameMode = "twoPlayer" | "fourPlayer";

type TurnStrategy = {
  getNextTurn: (currentTurn: number) => number;
  team: (currentTurn: number) => "white" | "black";
};

const turnStrategies: Record<string, TurnStrategy> = {
  twoPlayer: {
    getNextTurn: (currentTurn) => (currentTurn === 1 ? 2 : 1),
    team: (currentTurn) => (currentTurn === 1 ? "white" : "black"),
  },
  fourPlayer: {
    getNextTurn: (currentTurn) => (currentTurn % 4) + 1,
    team: (currentTurn) => (currentTurn % 2 === 0 ? "black" : "white"),
  },
};

type Layout = {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [wells, setWells] = useState<{
    white: Record<string, Layout>;
    black: Record<string, Layout>;
  }>({ white: {}, black: {} });
  const [spaces, setSpaces] = useState<Record<string, Layout>>({});
  const [slots, setSlots] = useState<Record<string, Layout>>({});
  const [corners, setCorners] = useState<Record<string, Layout>>({});

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
    Object.keys(wells.white).length > 0 &&
    Object.keys(wells.black).length > 0;

  const registerCell = useCallback(
    ({ id, team, type, layout }: CellRegisterProps) => {
      if (type === "slot") {
        setSlots((prev) => ({
          ...prev,
          [id]: layout,
        }));
      } else if (type === "space") {
        setSpaces((prev) => ({
          ...prev,
          [id]: layout,
        }));
      } else if (type === "well") {
        if (team) {
          setWells((prev) => ({
            ...prev,
            [team]: {
              ...prev[team],
              [id]: layout,
            },
          }));
        }
      } else if (type === "corner") {
        setCorners((prev) => ({
          ...prev,
          [id]: layout,
        }));
      } else {
        throw new Error("registerCell: unknown cell type");
      }
    },
    []
  );

  // TURN RULES

  const [playersTurn, setPlayersTurn] = useState(1);
  const [turnCount, setTurnCount] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode>("twoPlayer");

  const nextTurn = () => {
    const strategy = turnStrategies[gameMode];
    setPlayersTurn(strategy.getNextTurn(playersTurn));
    setTurnCount((prev) => prev + 1);
  };

  return (
    <GameContext.Provider
      value={{
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
        gameMode,
        nextTurn,
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
