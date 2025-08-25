import { ColorThemeType } from "@/constants/colorThemes";
import AsyncStorage from "@react-native-async-storage/async-storage";

const APP_STATE_KEY = "app_state_yeehaw";

type PersistedAppState = {
  theme?: ColorThemeType;
  boardPieceLocations?: Record<string, string>;
  wellPieceLocations?: Record<string, string>;
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
