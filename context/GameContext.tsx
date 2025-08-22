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
  slots: Record<string, SlotData>;
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

  const registerCell = useCallback(
    ({ id, team, type, layout }: CellRegisterProps) => {
      if (type === "slot") {
        setSlots((prev) => ({
          ...prev,
          [id]: { layout },
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
      } else {
        throw new Error("registerCell: unknown cell type");
      }
    },
    []
  );

  return (
    <GameContext.Provider
      value={{
        wells,
        spaces,
        slots,
        registerCell,
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
