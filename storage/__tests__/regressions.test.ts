import AsyncStorage from "@react-native-async-storage/async-storage";
import { createGame, placePiece } from "@/engine";
import { PieceStatus } from "@/types/pieceStatus";
import { clearSession, completeTutorial, loadAppState, saveSession, saveSettings } from "../storage";
import { DEFAULT_SETTINGS, gameStateToSerializable } from "../schema";

const key = "4sight_app_state_v1";
const snapshot = () => ({ game: gameStateToSerializable(placePiece(createGame(), { row: 0, col: 1 }, "0").state),
  pieceStatusMap: { "0": PieceStatus.onBoard }, wellPieceLocations: {} });

beforeEach(async () => { await loadAppState(); await AsyncStorage.clear(); });
afterEach(() => jest.restoreAllMocks());

it("preserves concurrent session, settings and onboarding writes", async () => {
  await Promise.all([saveSession(snapshot()), saveSettings({ shiftPreviews: false }),
    saveSettings({ themeId: "seaside" }), completeTutorial()]);
  const saved = await loadAppState();
  expect(saved.session?.game.board).toEqual({ "7-1": "0" });
  expect(saved.settings.shiftPreviews).toBe(false);
  expect(saved.settings.themeId).toBe("seaside");
  expect(saved.tutorialCompleted).toBe(true);
  await Promise.all([clearSession(), saveSettings({ highlightWinningMoves: false })]);
  const cleared = await loadAppState();
  expect(cleared.session).toBeNull();
  expect(cleared.settings.themeId).toBe("seaside");
  expect(cleared.tutorialCompleted).toBe(true);
});

it("reports a failed write and continues processing later writes", async () => {
  const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(AsyncStorage, "setItem").mockRejectedValueOnce(new Error("disk full"));
  await saveSettings({ shiftPreviews: false });
  await saveSettings({ themeId: "seaside" });
  expect(warn).toHaveBeenCalledWith("Could not persist 4Sight state:", expect.any(Error));
  expect((await loadAppState()).settings.themeId).toBe("seaside");
});

it.each([
  ["null piece", { pieces: { "0": null } }],
  ["array board", { board: [] }],
  ["array pieces", { pieces: [] }],
  ["invalid team", { currentTeam: "thirdTeam" }],
  ["invalid status", { status: "dragging" }],
  ["negative turn", { turnCount: -1 }],
  ["fractional turn", { turnCount: 1.2 }],
  ["outside coordinate", { board: { "0-1": "0" } }],
  ["duplicate piece", { board: { "1-1": "0", "2-2": "0" } }],
  ["unknown piece", { board: { "1-1": "48" } }],
  ["invalid piece identity", { pieces: { "0": { id: "1", team: "teamOne" } } }],
  ["invalid piece team", { pieces: { "0": { id: "0", team: "teamTwo" } } }],
  ["inconsistent result", { winner: "teamOne", status: "playing" }],
])("rejects %s while retaining valid settings", async (_name, patch) => {
  const session = snapshot();
  await AsyncStorage.setItem(key, JSON.stringify({ schemaVersion: 1,
    session: { ...session, game: { ...session.game, ...patch } }, settings: { ...DEFAULT_SETTINGS, themeId: "seaside" } }));
  const saved = await loadAppState();
  expect(saved.session).toBeNull();
  expect(saved.settings.themeId).toBe("seaside");
});

it("repairs held pieces and duplicate well membership from the authoritative board", async () => {
  const session = snapshot();
  await AsyncStorage.setItem(key, JSON.stringify({ schemaVersion: 1,
    settings: { shiftPreviews: "yes", themeId: "seaside" },
    session: { ...session, pieceStatusMap: { "0": "inWell", "1": "isHeld" },
      wellPieceLocations: { "9-9": "0", "10-9": "1", "11-9": "1", "bad": "2", "17-12": "3" } } }));
  const saved = await loadAppState();
  const restored = saved.session!;
  expect(restored.game.board).toEqual({ "7-1": "0" });
  expect(restored.pieceStatusMap["0"]).toBe(PieceStatus.onBoard);
  expect(restored.pieceStatusMap["1"]).toBe(PieceStatus.inWell);
  const wellIds = Object.values(restored.wellPieceLocations);
  expect(wellIds).not.toContain("0");
  expect(wellIds).toHaveLength(47);
  expect(new Set(wellIds).size).toBe(47);
  expect(saved.settings).toEqual({ ...DEFAULT_SETTINGS, themeId: "seaside" });
});
