import { CLASSIC } from "@/constants/themes/classic";
import { ThemeType } from "@/types/themes/theme";
import {
  loadAppState,
  PersistedAppState,
  saveAppState,
} from "@/utils/useAsyncStorage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useLogic } from "./LogicContext";

type SettingsContextType = {
  theme: ThemeType;
  setTheme: React.Dispatch<React.SetStateAction<ThemeType>>;
  shiftPreviews: boolean;
  setShiftPreviews: React.Dispatch<React.SetStateAction<boolean>>;
  piecePlacementPreviews: boolean;
  setPiecePlacementPreviews: React.Dispatch<React.SetStateAction<boolean>>;
  highlightWinningMoves: boolean;
  setHighlightWinningMoves: React.Dispatch<React.SetStateAction<boolean>>;
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<ThemeType>(CLASSIC);
  const [shiftPreviews, setShiftPreviews] = useState<boolean>(true);
  const [piecePlacementPreviews, setPiecePlacementPreviews] =
    useState<boolean>(true);
  const [highlightWinningMoves, setHighlightWinningMoves] =
    useState<boolean>(true);

  const logic = useLogic();

  const normalizeTheme = (input?: Partial<ThemeType>): ThemeType => {
    return {
      colorTheme: {
        ...CLASSIC.colorTheme,
        ...(input?.colorTheme || {}),
      },
      textAndFontTheme: {
        ...CLASSIC.textAndFontTheme,
        ...(input?.textAndFontTheme || {}),
      },
    };
  };

  const setAndPersistTheme: React.Dispatch<React.SetStateAction<ThemeType>> = (
    updater
  ) => {
    setTheme((prev) => {
      const next =
        typeof updater === "function"
          ? (updater as (prevState: ThemeType) => ThemeType)(prev)
          : updater;
      return normalizeTheme(next);
    });
  };

  useEffect(() => {
    const loadPersistedState = async () => {
      const saved = await loadAppState();
      if (saved?.theme) {
        setTheme(normalizeTheme(saved.theme));
      }
      if (saved.shiftPreviews !== undefined)
        setShiftPreviews(saved.shiftPreviews);
      if (saved.piecePlacementPreviews !== undefined)
        setPiecePlacementPreviews(saved.piecePlacementPreviews);
      if (saved.highlightWinningMoves !== undefined)
        setHighlightWinningMoves(saved.highlightWinningMoves);
      const hasBoard =
        saved.boardPieceLocations &&
        Object.keys(saved.boardPieceLocations).length > 0;
      const hasWells =
        saved.wellPieceLocations &&
        Object.keys(saved.wellPieceLocations).length > 0;
      if (hasBoard || hasWells) {
        logic.rehydrateFromSavedState(saved);
      }
    };
    loadPersistedState();
  }, []);

  // Persist theme whenever it changes
  useEffect(() => {
    saveAppState({ theme });
  }, [theme]);

  // Persist toggles when they change
  useEffect(() => {
    saveAppState({ shiftPreviews });
  }, [shiftPreviews]);
  useEffect(() => {
    saveAppState({ piecePlacementPreviews });
  }, [piecePlacementPreviews]);
  useEffect(() => {
    saveAppState({ highlightWinningMoves });
  }, [highlightWinningMoves]);

  // Persist game state every turn
  useEffect(() => {
    const state: PersistedAppState = {
      gameMode: logic.gameMode,
      turnCount: logic.turnCount,
      currentTeam: logic.currentTeam,
      gameState: logic.gameState,
      winner: logic.winner,
      pieces: logic.pieces,
      pieceStatusMap: logic.pieceStatusMap,
      playersTurn: logic.playersTurn,
      wellPieceLocations: logic.wellPieceLocations,
      boardPieceLocations: logic.boardPieceLocations,
    };
    saveAppState(state);
  }, [logic.turnCount, logic.winner]);

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme: setAndPersistTheme,
        shiftPreviews,
        setShiftPreviews,
        piecePlacementPreviews,
        setPiecePlacementPreviews,
        highlightWinningMoves,
        setHighlightWinningMoves,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
