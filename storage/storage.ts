import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CURRENT_SCHEMA_VERSION,
  DEFAULT_SETTINGS,
  PersistedAppState,
  PersistedSessionState,
  PersistedSettings,
} from "./schema";

const STORAGE_KEY = "4sight_app_state_v1";

function createDefaultState(): PersistedAppState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    session: null,
    settings: { ...DEFAULT_SETTINGS },
    tutorialCompleted: false,
  };
}

/**
 * Validates the raw parsed object has the expected shape.
 * Returns the validated state or null if invalid.
 */
function validateState(raw: unknown): PersistedAppState | null {
  if (!raw || typeof raw !== "object") return null;

  const obj = raw as Record<string, unknown>;

  if (typeof obj.schemaVersion !== "number") return null;
  if (obj.schemaVersion > CURRENT_SCHEMA_VERSION) return null;

  const state = migrateIfNeeded(obj as PersistedAppState);

  if (!state.settings || typeof state.settings !== "object") {
    state.settings = { ...DEFAULT_SETTINGS };
  }

  if (state.session !== null) {
    if (!isValidSession(state.session)) {
      state.session = null;
    }
  }

  if (typeof state.tutorialCompleted !== "boolean") {
    // Older installs had no flag; treat as already onboarded.
    state.tutorialCompleted = true;
  }

  return state;
}

function isValidSession(session: unknown): session is PersistedSessionState {
  if (!session || typeof session !== "object") return false;
  const s = session as Record<string, unknown>;

  if (!s.game || typeof s.game !== "object") return false;
  const game = s.game as Record<string, unknown>;
  if (typeof game.currentTeam !== "string") return false;
  if (typeof game.turnCount !== "number") return false;
  if (typeof game.status !== "string") return false;
  if (!game.board || typeof game.board !== "object") return false;
  if (!game.pieces || typeof game.pieces !== "object") return false;

  if (!s.pieceStatusMap || typeof s.pieceStatusMap !== "object") return false;
  if (!s.wellPieceLocations || typeof s.wellPieceLocations !== "object")
    return false;

  return true;
}

/**
 * Handles schema migrations from older versions to current.
 * Each version bump gets a migration step.
 */
function migrateIfNeeded(state: PersistedAppState): PersistedAppState {
  let current = { ...state };

  // Future migrations go here:
  // if (current.schemaVersion === 1) { current = migrateV1toV2(current); }

  current.schemaVersion = CURRENT_SCHEMA_VERSION;
  return current;
}

export async function loadAppState(): Promise<PersistedAppState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();

    const parsed = JSON.parse(raw);
    const validated = validateState(parsed);
    if (!validated) return createDefaultState();

    return validated;
  } catch {
    return createDefaultState();
  }
}

export async function saveSession(
  session: PersistedSessionState
): Promise<void> {
  try {
    const current = await loadAppState();
    current.session = session;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Silently fail — persistence is best-effort
  }
}

export async function saveSettings(
  settings: Partial<PersistedSettings>
): Promise<void> {
  try {
    const current = await loadAppState();
    current.settings = { ...current.settings, ...settings };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Silently fail
  }
}

export async function clearSession(): Promise<void> {
  try {
    const current = await loadAppState();
    current.session = null;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Silently fail
  }
}

export async function hasSavedSession(): Promise<boolean> {
  try {
    const state = await loadAppState();
    return (
      state.session !== null &&
      Object.keys(state.session.game.board).length > 0
    );
  } catch {
    return false;
  }
}
