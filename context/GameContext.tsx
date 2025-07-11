import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
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
  wellPieceLocations: Record<string, "white" | "black">;
  boardPieceLocations: Record<string, "white" | "black">;
  registerWellSpace: (
    team: "white" | "black",
    id: string,
    layout: Layout
  ) => void;
  registerBoardSpace: (id: string, layout: Layout) => void;
  registerSlot: (
    id: string,
    layout: Layout,
    orientation: "N" | "S" | "E" | "W"
  ) => void;
  setWellPieceLocations: React.Dispatch<
    React.SetStateAction<Record<string, "white" | "black">>
  >;
  setBoardPieceLocations: React.Dispatch<
    React.SetStateAction<Record<string, "white" | "black">>
  >;
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
    Record<string, "white" | "black">
  >({});

  const [boardPieceLocations, setBoardPieceLocations] = useState<
    Record<string, "white" | "black">
  >({});

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

  useEffect(() => {
    if (
      Object.keys(wellSpaces.white).length > 0 &&
      Object.keys(wellSpaces.black).length > 0
    ) {
      const initialLocations: Record<string, "white" | "black"> = {};

      for (const id of Object.keys(wellSpaces.white)) {
        initialLocations[id] = "white";
      }

      for (const id of Object.keys(wellSpaces.black)) {
        initialLocations[id] = "black";
      }

      setWellPieceLocations(initialLocations);
    }
  }, [wellSpaces]);

  return (
    <GameContext.Provider
      value={{
        wellSpaces,
        boardSpaces,
        slots,
        wellPieceLocations,
        boardPieceLocations,
        setWellPieceLocations,
        setBoardPieceLocations,
        registerWellSpace,
        registerBoardSpace,
        registerSlot,
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
