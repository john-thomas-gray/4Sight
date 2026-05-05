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
  useRef,
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
  const settingsRef = useRef({
    themeId: "classic",
    shiftPreviews: true,
    piecePlacementPreviews: true,
    highlightWinningMoves: true,
  });

  const theme = useMemo(() => getThemeById(themeId), [themeId]);

  // Load persisted settings on mount
  useEffect(() => {
    (async () => {
      const state = await loadAppState();
      settingsRef.current = { ...state.settings };
      setThemeIdState(state.settings.themeId);
      setShiftPreviewsState(state.settings.shiftPreviews);
      setPiecePlacementPreviewsState(state.settings.piecePlacementPreviews);
      setHighlightWinningMovesState(state.settings.highlightWinningMoves);
    })();
  }, []);

  const persistSettings = useCallback(
    (patch: Partial<typeof settingsRef.current>) => {
      const next = { ...settingsRef.current, ...patch };
      settingsRef.current = next;
      saveSettings(next);
    },
    [],
  );

  const setThemeById = useCallback((id: string) => {
    const exists = THEME_REGISTRY.some((t) => t.id === id);
    if (!exists) return;
    setThemeIdState(id);
    persistSettings({ themeId: id });
  }, [persistSettings]);

  const setShiftPreviews = useCallback((value: boolean) => {
    setShiftPreviewsState(value);
    persistSettings({ shiftPreviews: value });
  }, [persistSettings]);

  const setPiecePlacementPreviews = useCallback((value: boolean) => {
    setPiecePlacementPreviewsState(value);
    persistSettings({ piecePlacementPreviews: value });
  }, [persistSettings]);

  const setHighlightWinningMoves = useCallback((value: boolean) => {
    setHighlightWinningMovesState(value);
    persistSettings({ highlightWinningMoves: value });
  }, [persistSettings]);

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
