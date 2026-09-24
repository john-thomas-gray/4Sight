import AsyncStorage from "@react-native-async-storage/async-storage";
import { CURRENT_SCHEMA_VERSION, DEFAULT_SETTINGS, PersistedAppState, PersistedSessionState, PersistedSettings } from "./schema";
import { validateSession, validateSettings } from "./validation";
const STORAGE_KEY = "4sight_app_state_v1";
let pendingWrite: Promise<void> = Promise.resolve();
function createDefaultState(): PersistedAppState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    session: null,
    settings: {
      ...DEFAULT_SETTINGS
    },
    tutorialCompleted: false
  };
}
async function readAppState(): Promise<PersistedAppState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return createDefaultState();
    const state = parsed as Record<string, unknown>;
    if (!Number.isInteger(state.schemaVersion) || state.schemaVersion as number < 1 || state.schemaVersion as number > CURRENT_SCHEMA_VERSION) return createDefaultState();
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      settings: validateSettings(state.settings),
      session: validateSession(state.session),
      // Older installs had no flag; treat them as already onboarded.
      tutorialCompleted: typeof state.tutorialCompleted === "boolean" ? state.tutorialCompleted : true
    };
  } catch {
    return createDefaultState();
  }
}

/** Reads observe all writes requested before this call. */
export async function loadAppState(): Promise<PersistedAppState> {
  await pendingWrite;
  return readAppState();
}

/** One writer owns the complete read/modify/write transaction, including clears. */
function updateAppState(update: (state: PersistedAppState) => void): Promise<void> {
  pendingWrite = pendingWrite.then(async () => {
    const state = await readAppState();
    update(state);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }).catch((error: unknown) => {
    console.warn("Could not persist 4Sight state:", error);
  });
  return pendingWrite;
}
export function saveSession(session: PersistedSessionState): Promise<void> {
  // Snapshot at enqueue time so callers cannot mutate a pending write.
  const snapshot = JSON.parse(JSON.stringify(session)) as PersistedSessionState;
  return updateAppState(state => {
    state.session = snapshot;
  });
}
export function saveSettings(settings: Partial<PersistedSettings>): Promise<void> {
  const patch = {
    ...settings
  };
  return updateAppState(state => {
    state.settings = validateSettings({
      ...state.settings,
      ...patch
    });
  });
}
export function clearSession(): Promise<void> {
  return updateAppState(state => {
    state.session = null;
  });
}
export function completeTutorial(): Promise<void> {
  return updateAppState(state => {
    state.tutorialCompleted = true;
  });
}
export async function hasSavedSession(): Promise<boolean> {
  const state = await loadAppState();
  return state.session !== null && Object.keys(state.session.game.board).length > 0;
}
