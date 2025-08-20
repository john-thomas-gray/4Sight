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
  orientation: "N" | "S" | "E" | "W";
};

type GameContextType = {
  wellSpaces: {
    white: Record<string, Layout>;
    black: Record<string, Layout>;
  };
  boardSpaces: Record<string, Layout>;
  slots: Record<string, SlotData>;
  wellPieceLocations: Record<string, string>;
  boardPieceLocations: Record<string, string>;
  registerWellSpace: (
    team: "white" | "black",
    id: string,
    layout: Layout,
    heldPieceId: string
  ) => void;
  registerBoardSpace: (id: string, layout: Layout) => void;
  registerSlot: (
    id: string,
    layout: Layout,
    orientation: "N" | "S" | "E" | "W"
  ) => void;
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
  const [wellSpaces, setWellSpaces] = useState<{
    white: Record<string, Layout>;
    black: Record<string, Layout>;
  }>({ white: {}, black: {} });

  const [boardSpaces, setBoardSpaces] = useState<Record<string, Layout>>({});
  const [slots, setSlots] = useState<Record<string, SlotData>>({});

  const [wellPieceLocations, setWellPieceLocations] = useState<
    Record<string, string>
  >({});

  const [boardPieceLocations, setBoardPieceLocations] = useState<
    Record<string, string>
  >({});

<<<<<<< HEAD
  const layoutReady =
    Object.keys(slots).length > 0 &&
    Object.keys(boardSpaces).length > 0 &&
    Object.keys(wellSpaces.white).length > 0 &&
    Object.keys(wellSpaces.black).length > 0;

=======
>>>>>>> gestureHandler
  const registerWellSpace = useCallback(
    (team: "white" | "black", id: string, layout: Layout) => {
      setWellSpaces((prev) => ({
        ...prev,
        [team]: {
          ...prev[team],
          [id]: layout,
        },
      }));
    },
    []
  );

  const registerBoardSpace = useCallback((id: string, layout: Layout) => {
    setBoardSpaces((prev) => ({
      ...prev,
      [id]: layout,
    }));
  }, []);

  const registerSlot = useCallback(
    (id: string, layout: Layout, orientation: "N" | "S" | "E" | "W") => {
      setSlots((prev) => ({
        ...prev,
        [id]: { layout, orientation },
      }));
    },
    []
  );

  return (
    <GameContext.Provider
      value={{
        wellSpaces,
        registerWellSpace,
        boardSpaces,
        registerBoardSpace,
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
