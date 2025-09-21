import { ColorThemeType } from "@/constants/colorThemes";
import { Team } from "@/types/board";
import { GameMode, GameState, PieceProps, PieceStatusMap } from "@/types/logic";
import AsyncStorage from "@react-native-async-storage/async-storage";

const APP_STATE_KEY = "app_state_yeehaw";

export type PersistedAppState = {
  theme?: ColorThemeType;
  // Game state persistence
  gameMode?: GameMode;
  turnCount?: number;
  currentTeam?: Team; // derived from playersTurn but kept for convenience
  gameState?: GameState;
  winner?: Team;
  pieces?: Record<string, PieceProps>;
  pieceStatusMap?: PieceStatusMap;
  playersTurn?: 1 | 2 | 3 | 4;
  wellPieceLocations?: Record<string, string>;
  boardPieceLocations?: Record<string, string>;
};

export const saveAppState = async (state: Partial<PersistedAppState>) => {
  try {
    if (APP_STATE_KEY !== undefined) {
      const existing = await AsyncStorage.getItem(APP_STATE_KEY);
      const existingState: PersistedAppState = existing
        ? JSON.parse(existing)
        : {};
      const newState = { ...existingState, ...state };
      await AsyncStorage.setItem(APP_STATE_KEY, JSON.stringify(newState));
    }
  } catch (e) {
    console.error("Failed to save app state", e);
  }
};

export const loadAppState = async (): Promise<PersistedAppState> => {
  try {
    if (APP_STATE_KEY !== undefined) {
      const saved = await AsyncStorage.getItem(APP_STATE_KEY);
      return saved ? JSON.parse(saved) : {};
    }
  } catch (e) {
    console.error("Failed to load app state", e);
  }
  return {};
};
