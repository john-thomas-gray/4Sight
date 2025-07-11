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

type GameContextType = {
  wellSpaces: {
    white: Record<string, Layout>;
    black: Record<string, Layout>;
  };
  wellPieceLocations: Record<string, "white" | "black">;
  registerWellSpace: (
    team: "white" | "black",
    id: string,
    layout: Layout
  ) => void;
  setWellPieceLocations: React.Dispatch<
    React.SetStateAction<Record<string, "white" | "black">>
  >;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [wellSpaces, setWellSpaces] = useState<{
    white: Record<string, Layout>;
    black: Record<string, Layout>;
  }>({ white: {}, black: {} });

  const [wellPieceLocations, setWellPieceLocations] = useState<
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

  useEffect(() => {
    // Only proceed if there is at least one white and black space registered
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
  }, [wellSpaces, setWellPieceLocations]);

  return (
    <GameContext.Provider
      value={{
        wellSpaces,
        registerWellSpace,
        wellPieceLocations,
        setWellPieceLocations,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context)
    throw new Error("useGameContext must be used within GameProvider");
  return context;
};
