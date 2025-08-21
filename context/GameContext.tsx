import { CellTeam } from "@/types/board";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

type Layout = {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
};

type SlotData = {
  layout: Layout;
};

type GameContextType = {
  wells: {
    white: Record<string, Layout>;
    black: Record<string, Layout>;
  };
  spaces: Record<string, Layout>;
  slots: Record<string, SlotData>;
  wellPieceLocations: Record<string, string>;
  boardPieceLocations: Record<string, string>;
  registerWell: (id: string, team: CellTeam, layout: Layout) => void;
  registerSpace: (id: string, layout: Layout) => void;
  registerSlot: (id: string, layout: Layout) => void;
  setWellPieceLocations: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  setBoardPieceLocations: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  currentBoardId?: string | null;
  layoutReady: boolean;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [wells, setWells] = useState<{
    white: Record<string, Layout>;
    black: Record<string, Layout>;
  }>({ white: {}, black: {} });

  const [spaces, setSpaces] = useState<Record<string, Layout>>({});
  const [slots, setSlots] = useState<Record<string, SlotData>>({});

  const [wellPieceLocations, setWellPieceLocations] = useState<
    Record<string, string>
  >({});

  const [boardPieceLocations, setBoardPieceLocations] = useState<
    Record<string, string>
  >({});

  const layoutReady =
    Object.keys(slots).length > 0 &&
    Object.keys(spaces).length > 0 &&
    Object.keys(wells.white).length > 0 &&
    Object.keys(wells.black).length > 0;

  const registerWell = useCallback(
    (id: string, team: CellTeam, layout: Layout) => {
      if (team) {
        team.toString();
        setWells((prev) => ({
          ...prev,
          [team]: {
            ...prev[team],
            [id]: layout,
          },
        }));
      } else {
        throw Error("registerWell: team undefined or improperly formatted");
      }
    },
    []
  );

  const registerSpace = useCallback((id: string, layout: Layout) => {
    setSpaces((prev) => ({
      ...prev,
      [id]: layout,
    }));
  }, []);

  const registerSlot = useCallback((id: string, layout: Layout) => {
    setSlots((prev) => ({
      ...prev,
      [id]: { layout },
    }));
  }, []);

  return (
    <GameContext.Provider
      value={{
        wells,
        registerWell,
        spaces,
        registerSpace,
        slots,
        registerSlot,
        wellPieceLocations,
        setWellPieceLocations,
        boardPieceLocations,
        setBoardPieceLocations,
        layoutReady,
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
