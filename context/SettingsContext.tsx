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
  // teamTheme:
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<ThemeType>(CLASSIC);

  const logic = useLogic();

  useEffect(() => {
    const loadPersistedState = async () => {
      const saved = await loadAppState();
      if (saved?.theme) {
        setTheme(saved.theme);
      }
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

  // Persist game state whenever it changes
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
  }, [
    logic.gameMode,
    logic.turnCount,
    logic.currentTeam,
    logic.gameState,
    logic.winner,
    logic.pieces,
    logic.pieceStatusMap,
    logic.playersTurn,
    logic.wellPieceLocations,
    logic.boardPieceLocations,
  ]);

  return (
    <SettingsContext.Provider value={{ theme, setTheme }}>
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
