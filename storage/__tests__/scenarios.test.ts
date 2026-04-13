import { createGame, Team, PIECES_PER_TEAM } from "@/engine";
import type { GameState } from "@/engine";
import {
  gameStateToSerializable,
  serializableToGameState,
  DEFAULT_SETTINGS,
} from "../schema";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AsyncStorage = require("@react-native-async-storage/async-storage");
const {
  loadAppState,
  saveSession,
  saveSettings,
  clearSession,
  hasSavedSession,
} = require("../storage");

// ---------------------------------------------------------------------------
// Full game lifecycle scenarios
// ---------------------------------------------------------------------------
describe("save / continue / reset lifecycle", () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  it("new game -> play moves -> save -> load -> continue", async () => {
    const initialState = createGame();
    const midGameBoard = { "7-3": "0", "7-4": String(PIECES_PER_TEAM) };
    const midGameState: GameState = {
      ...initialState,
      board: midGameBoard,
      currentTeam: Team.One,
      turnCount: 3,
    };

    const session = {
      game: gameStateToSerializable(midGameState),
      pieceStatusMap: {
        "0": "onBoard",
        [String(PIECES_PER_TEAM)]: "onBoard",
      },
      wellPieceLocations: { "9-9": "1", "17-12": String(PIECES_PER_TEAM + 1) },
    };

    await saveSession(session);
    expect(await hasSavedSession()).toBe(true);

    const loaded = await loadAppState();
    expect(loaded.session).not.toBeNull();

    const restored = serializableToGameState(loaded.session!.game);
    expect(restored.board).toEqual(midGameBoard);
    expect(restored.currentTeam).toBe(Team.One);
    expect(restored.turnCount).toBe(3);
    expect(loaded.session!.pieceStatusMap["0"]).toBe("onBoard");
  });

  it("save -> reset -> no saved session", async () => {
    const session = {
      game: gameStateToSerializable(createGame()),
      pieceStatusMap: {},
      wellPieceLocations: {},
    };
    // save with some board state
    session.game.board = { "1-1": "0" };
    await saveSession(session);
    expect(await hasSavedSession()).toBe(true);

    await clearSession();
    expect(await hasSavedSession()).toBe(false);

    const loaded = await loadAppState();
    expect(loaded.session).toBeNull();
  });

  it("settings persist across session clear", async () => {
    await saveSettings({ themeId: "schoolhouse", shiftPreviews: false });
    await saveSession({
      game: gameStateToSerializable({
        ...createGame(),
        board: { "3-3": "5" },
      }),
      pieceStatusMap: { "5": "onBoard" },
      wellPieceLocations: {},
    });
    expect(await hasSavedSession()).toBe(true);

    await clearSession();

    const loaded = await loadAppState();
    expect(loaded.session).toBeNull();
    expect(loaded.settings.themeId).toBe("schoolhouse");
    expect(loaded.settings.shiftPreviews).toBe(false);
  });

  it("multiple save calls merge correctly", async () => {
    await saveSettings({ themeId: "schoolhouse" });
    await saveSettings({ highlightWinningMoves: false });

    const loaded = await loadAppState();
    expect(loaded.settings.themeId).toBe("schoolhouse");
    expect(loaded.settings.highlightWinningMoves).toBe(false);
    expect(loaded.settings.shiftPreviews).toBe(true);
  });

  it("finished game state survives round-trip", async () => {
    const finishedState: GameState = {
      ...createGame(),
      board: { "7-1": "0", "7-2": "1", "7-3": "2", "7-4": "3" },
      winner: Team.One,
      status: "finished",
      turnCount: 7,
    };
    const session = {
      game: gameStateToSerializable(finishedState),
      pieceStatusMap: { "0": "winner", "1": "winner", "2": "winner", "3": "winner" },
      wellPieceLocations: {},
    };
    await saveSession(session);

    const loaded = await loadAppState();
    const restored = serializableToGameState(loaded.session!.game);
    expect(restored.winner).toBe(Team.One);
    expect(restored.status).toBe("finished");
    expect(loaded.session!.pieceStatusMap["0"]).toBe("winner");
  });

  it("handles corrupt data after valid save gracefully", async () => {
    await saveSession({
      game: gameStateToSerializable(createGame()),
      pieceStatusMap: {},
      wellPieceLocations: {},
    });

    // Corrupt the storage
    await AsyncStorage.setItem("4sight_app_state_v1", "{broken json{{{");

    const loaded = await loadAppState();
    expect(loaded.schemaVersion).toBe(1);
    expect(loaded.session).toBeNull();
    expect(loaded.settings).toEqual(DEFAULT_SETTINGS);
  });
});
