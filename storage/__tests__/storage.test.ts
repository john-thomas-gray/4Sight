import {
  gameStateToSerializable,
  serializableToGameState,
  CURRENT_SCHEMA_VERSION,
  DEFAULT_SETTINGS,
} from "../schema";
import { createGame, Team, PIECES_PER_TEAM } from "@/engine";
import type { GameState } from "@/engine";

// ---------------------------------------------------------------------------
// Schema serialization round-trip
// ---------------------------------------------------------------------------
describe("gameStateToSerializable / serializableToGameState", () => {
  it("round-trips a fresh game state", () => {
    const original = createGame();
    const serialized = gameStateToSerializable(original);
    const restored = serializableToGameState(serialized);

    expect(restored.board).toEqual(original.board);
    expect(restored.currentTeam).toBe(original.currentTeam);
    expect(restored.turnCount).toBe(original.turnCount);
    expect(restored.winner).toBe(original.winner);
    expect(restored.status).toBe(original.status);
    expect(Object.keys(restored.pieces)).toHaveLength(PIECES_PER_TEAM * 2);
  });

  it("round-trips a mid-game state with pieces on board", () => {
    const original: GameState = {
      ...createGame(),
      board: { "3-4": "0", "5-2": "24" },
      currentTeam: Team.Two,
      turnCount: 5,
    };
    const serialized = gameStateToSerializable(original);
    const restored = serializableToGameState(serialized);

    expect(restored.board).toEqual({ "3-4": "0", "5-2": "24" });
    expect(restored.currentTeam).toBe(Team.Two);
    expect(restored.turnCount).toBe(5);
  });

  it("round-trips a finished game state", () => {
    const original: GameState = {
      ...createGame(),
      board: { "7-1": "0", "7-2": "1", "7-3": "2", "7-4": "3" },
      winner: Team.One,
      status: "finished",
      turnCount: 7,
    };
    const serialized = gameStateToSerializable(original);
    const restored = serializableToGameState(serialized);

    expect(restored.winner).toBe(Team.One);
    expect(restored.status).toBe("finished");
  });

  it("serialized form is JSON-safe (no class instances)", () => {
    const original = createGame();
    const serialized = gameStateToSerializable(original);
    const json = JSON.stringify(serialized);
    const parsed = JSON.parse(json);

    expect(parsed.board).toEqual(serialized.board);
    expect(parsed.currentTeam).toBe(serialized.currentTeam);
    expect(parsed.turnCount).toBe(serialized.turnCount);
  });
});

// ---------------------------------------------------------------------------
// Schema constants
// ---------------------------------------------------------------------------
describe("schema constants", () => {
  it("has a current version", () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(1);
  });

  it("provides default settings", () => {
    expect(DEFAULT_SETTINGS.shiftPreviews).toBe(true);
    expect(DEFAULT_SETTINGS.piecePlacementPreviews).toBe(true);
    expect(DEFAULT_SETTINGS.highlightWinningMoves).toBe(true);
    expect(DEFAULT_SETTINGS.themeId).toBe("classic");
  });
});

// ---------------------------------------------------------------------------
// Validation (via storage module with mocked AsyncStorage)
// ---------------------------------------------------------------------------
// We test the validation logic indirectly through loadAppState.
// AsyncStorage is mocked by __mocks__/@react-native-async-storage/async-storage.
describe("loadAppState validation", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AsyncStorage = require("@react-native-async-storage/async-storage");
  const { loadAppState } = require("../storage");

  beforeEach(() => {
    AsyncStorage.clear();
  });

  it("returns defaults when no saved state exists", async () => {
    const result = await loadAppState();
    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(result.session).toBeNull();
    expect(result.settings).toEqual(DEFAULT_SETTINGS);
  });

  it("returns defaults when storage contains invalid JSON", async () => {
    await AsyncStorage.setItem("4sight_app_state_v1", "not json{{{");
    const result = await loadAppState();
    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(result.session).toBeNull();
  });

  it("returns defaults when storage contains wrong shape", async () => {
    await AsyncStorage.setItem(
      "4sight_app_state_v1",
      JSON.stringify({ foo: "bar" })
    );
    const result = await loadAppState();
    expect(result.session).toBeNull();
    expect(result.settings).toEqual(DEFAULT_SETTINGS);
  });

  it("returns defaults when schema version is too high", async () => {
    await AsyncStorage.setItem(
      "4sight_app_state_v1",
      JSON.stringify({ schemaVersion: 999 })
    );
    const result = await loadAppState();
    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("loads valid saved state", async () => {
    const validState = {
      schemaVersion: 1,
      session: {
        game: {
          board: { "3-4": "0" },
          pieces: { "0": { id: "0", team: "teamOne" } },
          currentTeam: "teamTwo",
          turnCount: 2,
          winner: null,
          status: "playing",
        },
        pieceStatusMap: { "0": "onBoard" },
        wellPieceLocations: {},
      },
      settings: DEFAULT_SETTINGS,
    };
    await AsyncStorage.setItem(
      "4sight_app_state_v1",
      JSON.stringify(validState)
    );
    const result = await loadAppState();
    expect(result.session).not.toBeNull();
    expect(result.session!.game.board["3-4"]).toBe("0");
    expect(result.session!.game.currentTeam).toBe("teamTwo");
  });

  it("discards invalid session but keeps settings", async () => {
    const partiallyValid = {
      schemaVersion: 1,
      session: { game: "not an object" },
      settings: { ...DEFAULT_SETTINGS, themeId: "schoolhouse" },
    };
    await AsyncStorage.setItem(
      "4sight_app_state_v1",
      JSON.stringify(partiallyValid)
    );
    const result = await loadAppState();
    expect(result.session).toBeNull();
    expect(result.settings.themeId).toBe("schoolhouse");
  });
});

// ---------------------------------------------------------------------------
// Save and clear
// ---------------------------------------------------------------------------
describe("saveSession / clearSession / hasSavedSession", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AsyncStorage = require("@react-native-async-storage/async-storage");
  const {
    saveSession,
    clearSession,
    hasSavedSession,
    loadAppState,
  } = require("../storage");

  beforeEach(() => {
    AsyncStorage.clear();
  });

  it("saves and retrieves a session", async () => {
    const session = {
      game: {
        board: { "1-1": "5" },
        pieces: { "5": { id: "5", team: "teamOne" } },
        currentTeam: "teamOne",
        turnCount: 3,
        winner: null,
        status: "playing",
      },
      pieceStatusMap: { "5": "onBoard" },
      wellPieceLocations: { "9-9": "0" },
    };
    await saveSession(session);
    const loaded = await loadAppState();
    expect(loaded.session).not.toBeNull();
    expect(loaded.session!.game.board["1-1"]).toBe("5");
  });

  it("hasSavedSession returns true after save", async () => {
    expect(await hasSavedSession()).toBe(false);
    const session = {
      game: {
        board: { "1-1": "5" },
        pieces: { "5": { id: "5", team: "teamOne" } },
        currentTeam: "teamOne",
        turnCount: 1,
        winner: null,
        status: "playing",
      },
      pieceStatusMap: {},
      wellPieceLocations: {},
    };
    await saveSession(session);
    expect(await hasSavedSession()).toBe(true);
  });

  it("clearSession removes the session", async () => {
    const session = {
      game: {
        board: { "1-1": "5" },
        pieces: { "5": { id: "5", team: "teamOne" } },
        currentTeam: "teamOne",
        turnCount: 1,
        winner: null,
        status: "playing",
      },
      pieceStatusMap: {},
      wellPieceLocations: {},
    };
    await saveSession(session);
    await clearSession();
    const loaded = await loadAppState();
    expect(loaded.session).toBeNull();
    expect(await hasSavedSession()).toBe(false);
  });

  it("clearSession preserves settings", async () => {
    const { saveSettings } = require("../storage");
    await saveSettings({ themeId: "schoolhouse" });
    const session = {
      game: {
        board: { "1-1": "5" },
        pieces: { "5": { id: "5", team: "teamOne" } },
        currentTeam: "teamOne",
        turnCount: 1,
        winner: null,
        status: "playing",
      },
      pieceStatusMap: {},
      wellPieceLocations: {},
    };
    await saveSession(session);
    await clearSession();
    const loaded = await loadAppState();
    expect(loaded.session).toBeNull();
    expect(loaded.settings.themeId).toBe("schoolhouse");
  });
});
