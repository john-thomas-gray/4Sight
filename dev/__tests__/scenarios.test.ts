import {
  BOARD_SIZE,
  Direction,
  PIECES_PER_TEAM,
  Team,
  coordToKey,
  isPlayable,
} from "@/engine";
import { buildInitialWellPieceLocations } from "@/constants/wells";
import { getScenario, getScenarioDelay, scenarios } from "../scenarios";

describe("dev scenarios", () => {
  it("exposes named scenarios with valid teams and fallback delays", () => {
    expect(getScenario("nearWin")).toBe(scenarios.nearWin);
    expect(getScenario("missing")).toBeUndefined();
    expect(getScenarioDelay(scenarios.nearWin)).toBe(1500);
    expect(getScenarioDelay(scenarios.tutorialStep1)).toBe(1200);
    expect(
      Object.values(scenarios).every(
        (scenario) =>
          scenario.currentTeam === Team.One || scenario.currentTeam === Team.Two,
      ),
    ).toBe(true);
  });

  it("keeps scenario boards, moves, and pieces inside the playable game model", () => {
    const allPieceIds = new Set(
      Array.from({ length: PIECES_PER_TEAM * 2 }, (_, i) => String(i)),
    );

    for (const [name, scenario] of Object.entries(scenarios)) {
      const occupied = new Set<string>();

      for (const [key, pieceId] of Object.entries(scenario.board)) {
        const [row, col] = key.split("-").map(Number);
        expect(isPlayable({ row, col })).toBe(true);
        expect(allPieceIds.has(pieceId)).toBe(true);
        expect(occupied.has(pieceId)).toBe(false);
        occupied.add(pieceId);
      }

      for (const move of scenario.moves) {
        if (move.type === "gravity") {
          expect(Object.values(Direction)).toContain(move.direction);
          continue;
        }
        expect(isPlayable(move.targetSpace)).toBe(true);
        expect(allPieceIds.has(move.pieceId)).toBe(true);
        expect(occupied.has(move.pieceId)).toBe(false);
      }

      expect(Object.keys(scenario.board).every((key) => key.includes("-")))
        .toBe(true);
      expect(name.length).toBeGreaterThan(0);
    }
  });

  it("keeps tutorial well overrides consistent with board occupancy", () => {
    const defaultWellIds = new Set(Object.keys(buildInitialWellPieceLocations()));

    for (const scenario of Object.values(scenarios)) {
      if (!scenario.wellPieceLocations) continue;
      const boardPieceIds = new Set(Object.values(scenario.board));
      for (const [wellId, pieceId] of Object.entries(
        scenario.wellPieceLocations,
      )) {
        expect(defaultWellIds.has(wellId)).toBe(true);
        expect(boardPieceIds.has(pieceId)).toBe(false);
      }
    }
  });

  it("uses a 7x7 engine board while the UI frame surrounds it with slots", () => {
    expect(coordToKey({ row: BOARD_SIZE, col: BOARD_SIZE })).toBe("7-7");
  });
});
