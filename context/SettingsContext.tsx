import { CLASSIC } from "@/constants/themes/classic/colorTheme";
import { ColorThemeType } from "@/types/themes/colorTheme";
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
  colorTheme: ColorThemeType;
  setColorTheme: React.Dispatch<React.SetStateAction<ColorThemeType>>;
  // teamTheme:
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [colorTheme, setColorTheme] = useState<ColorThemeType>(CLASSIC);
  // const [teamTheme, setTeamTheme] = useState<TeamThemeType>(CLASSIC);
  const logic = useLogic();

  // Load saved theme and game state on mount
  useEffect(() => {
    const loadPersistedState = async () => {
      const saved = await loadAppState();
      if (saved?.theme) {
        setColorTheme(saved.theme);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist theme whenever it changes
  useEffect(() => {
    saveAppState({ theme: colorTheme });
  }, [colorTheme]);

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
    <SettingsContext.Provider value={{ colorTheme, setColorTheme }}>
      {children}
    </SettingsContext.Provider>
  );
};

// Hook for consuming the context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
