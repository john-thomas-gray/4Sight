// SettingsContext.tsx
import { CLASSIC, ColorThemeType } from "@/constants/colorThemes";
import { loadAppState, saveAppState } from "@/utils/useAsyncStorage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type SettingsContextType = {
  colorTheme: ColorThemeType;
  setColorTheme: React.Dispatch<React.SetStateAction<ColorThemeType>>;
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [colorTheme, setColorTheme] = useState<ColorThemeType>(CLASSIC);

  // Load saved theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      const saved = await loadAppState();
      if (saved?.theme) {
        setColorTheme(saved.theme);
      }
      // if (saved.boardPieceLocations) {
      //   setBoardPieceLocations(saved.boardPieceLocations);
      // }

      // if (saved.wellPieceLocations) {
      //   setWellPieceLocations(saved.wellPieceLocations);
      // }
      // useEffect(() => {
      //   console.log("turn changed");
      //   saveAppState({ boardPieceLocations });
      //   saveAppState({ wellPieceLocations });
      // }, [turnCount]);
    };
    loadTheme();
  }, []);

  // Persist theme whenever it changes
  useEffect(() => {
    saveAppState({ theme: colorTheme });
  }, [colorTheme]);

  return (
    <SettingsContext.Provider value={{ colorTheme, setColorTheme }}>
      {children}
    </SettingsContext.Provider>
  );
};

// Hook for consuming the context
export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error(
      "useSettingsContext must be used within a SettingsProvider"
    );
  }
  return context;
};
