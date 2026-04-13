import { getThemeById, THEME_REGISTRY } from "@/constants/themes/registry";
import { loadAppState, saveSettings } from "@/storage";
import { ThemeType } from "@/types/themes/theme";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type SettingsContextType = {
  theme: ThemeType;
  themeId: string;
  setThemeById: (id: string) => void;
  shiftPreviews: boolean;
  setShiftPreviews: (value: boolean) => void;
  piecePlacementPreviews: boolean;
  setPiecePlacementPreviews: (value: boolean) => void;
  highlightWinningMoves: boolean;
  setHighlightWinningMoves: (value: boolean) => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [themeId, setThemeIdState] = useState("classic");
  const [shiftPreviews, setShiftPreviewsState] = useState(true);
  const [piecePlacementPreviews, setPiecePlacementPreviewsState] = useState(true);
  const [highlightWinningMoves, setHighlightWinningMovesState] = useState(true);

  const theme = useMemo(() => getThemeById(themeId), [themeId]);

  // Load persisted settings on mount
  useEffect(() => {
    (async () => {
      const state = await loadAppState();
      setThemeIdState(state.settings.themeId);
      setShiftPreviewsState(state.settings.shiftPreviews);
      setPiecePlacementPreviewsState(state.settings.piecePlacementPreviews);
      setHighlightWinningMovesState(state.settings.highlightWinningMoves);
    })();
  }, []);

  const setThemeById = useCallback((id: string) => {
    const exists = THEME_REGISTRY.some((t) => t.id === id);
    if (!exists) return;
    setThemeIdState(id);
    saveSettings({ themeId: id });
  }, []);

  const setShiftPreviews = useCallback((value: boolean) => {
    setShiftPreviewsState(value);
    saveSettings({ shiftPreviews: value });
  }, []);

  const setPiecePlacementPreviews = useCallback((value: boolean) => {
    setPiecePlacementPreviewsState(value);
    saveSettings({ piecePlacementPreviews: value });
  }, []);

  const setHighlightWinningMoves = useCallback((value: boolean) => {
    setHighlightWinningMovesState(value);
    saveSettings({ highlightWinningMoves: value });
  }, []);

  const value = useMemo<SettingsContextType>(
    () => ({
      theme,
      themeId,
      setThemeById,
      shiftPreviews,
      setShiftPreviews,
      piecePlacementPreviews,
      setPiecePlacementPreviews,
      highlightWinningMoves,
      setHighlightWinningMoves,
    }),
    [
      theme,
      themeId,
      setThemeById,
      shiftPreviews,
      setShiftPreviews,
      piecePlacementPreviews,
      setPiecePlacementPreviews,
      highlightWinningMoves,
      setHighlightWinningMoves,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
};
