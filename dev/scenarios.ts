import { Team, Direction } from "@/engine";
import type { Coord } from "@/engine";

export type ScenarioMove =
  | { type: "place"; targetSpace: Coord; pieceId: string }
  | { type: "gravity"; direction: Direction };

export type Scenario = {
  board: Record<string, string>;
  currentTeam: Team;
  moves: ScenarioMove[];
  delayMs?: number;
  /** When set, replaces default well layout (e.g. tutorial with a single spare piece). */
  wellPieceLocations?: Record<string, string>;
};

const DEFAULT_DELAY_MS = 1200;

export const scenarios: Record<string, Scenario> = {
  nearWin: {
    board: {
      "3-3": "0",
      "3-4": "1",
      "3-5": "2",
      "4-3": "24",
      "4-4": "25",
    },
    currentTeam: Team.One,
    moves: [
      { type: "place", targetSpace: { row: 3, col: 6 }, pieceId: "3" },
    ],
    delayMs: 1500,
  },

  tripleWin: {
    board: {
      "4-3": "0",
      "4-5": "1",
      "4-6": "2",
      "5-4": "3",
      "6-4": "4",
      "7-4": "5",
      "5-5": "6",
      "6-6": "7",
      "7-7": "8",
      "2-2": "24",
      "2-6": "25",
      "3-5": "26",
      "6-2": "27",
    },
    currentTeam: Team.One,
    moves: [
      { type: "place", targetSpace: { row: 4, col: 4 }, pieceId: "9" },
    ],
    delayMs: 1500,
  },

  tieGame: {
    board: {
      "3-2": "0",
      "3-4": "1",
      "3-5": "2",
      "3-7": "3",
      "5-3": "24",
      "5-5": "25",
      "5-6": "26",
      "5-7": "27",
    },
    currentTeam: Team.One,
    moves: [{ type: "gravity", direction: Direction.Left }],
    delayMs: 1500,
  },

  gravityWin: {
    board: {
      "5-2": "0",
      "5-5": "1",
      "6-3": "2",
      "3-2": "24",
      "3-4": "25",
      "3-5": "26",
      "3-7": "27",
    },
    currentTeam: Team.Two,
    moves: [{ type: "gravity", direction: Direction.Left }],
    delayMs: 1500,
  },

  /** Tutorial step 1: drag white's only spare piece from the well onto the board. */
  tutorialStep1: {
    board: {},
    currentTeam: Team.One,
    moves: [],
    wellPieceLocations: {
      "12-10": "0",
    },
  },

  /**
   * Dev drill: lone piece in column 1 (interior) runs four gravity pulls, then
   * alternating drops stack columns 3–5 and finish with a horizontal Team One win.
   * See `dev/__tests__/fullInteractionDrill.test.ts` for tie, drop outcomes, and previews.
   */
  fullInteractionDrill: {
    board: {
      "2-1": "10",
    },
    currentTeam: Team.One,
    moves: [
      { type: "gravity", direction: Direction.Down },
      { type: "gravity", direction: Direction.Up },
      { type: "gravity", direction: Direction.Right },
      { type: "gravity", direction: Direction.Left },
      { type: "place", targetSpace: { row: 7, col: 3 }, pieceId: "0" },
      { type: "place", targetSpace: { row: 6, col: 3 }, pieceId: "24" },
      { type: "place", targetSpace: { row: 5, col: 3 }, pieceId: "1" },
      { type: "place", targetSpace: { row: 4, col: 3 }, pieceId: "25" },
      { type: "place", targetSpace: { row: 3, col: 3 }, pieceId: "2" },
      { type: "place", targetSpace: { row: 7, col: 4 }, pieceId: "26" },
      { type: "place", targetSpace: { row: 6, col: 4 }, pieceId: "3" },
      { type: "place", targetSpace: { row: 5, col: 4 }, pieceId: "27" },
      { type: "place", targetSpace: { row: 4, col: 4 }, pieceId: "4" },
      { type: "place", targetSpace: { row: 7, col: 7 }, pieceId: "28" },
      { type: "place", targetSpace: { row: 3, col: 4 }, pieceId: "5" },
      { type: "place", targetSpace: { row: 7, col: 5 }, pieceId: "29" },
      { type: "place", targetSpace: { row: 6, col: 5 }, pieceId: "6" },
      { type: "place", targetSpace: { row: 5, col: 5 }, pieceId: "30" },
      { type: "place", targetSpace: { row: 4, col: 5 }, pieceId: "7" },
      { type: "place", targetSpace: { row: 7, col: 2 }, pieceId: "31" },
      { type: "place", targetSpace: { row: 3, col: 5 }, pieceId: "8" },
      { type: "place", targetSpace: { row: 6, col: 2 }, pieceId: "32" },
      { type: "place", targetSpace: { row: 3, col: 6 }, pieceId: "9" },
    ],
    delayMs: 800,
  },
};

export function getScenario(name: string): Scenario | undefined {
  return scenarios[name];
}

export function getScenarioDelay(scenario: Scenario): number {
  return scenario.delayMs ?? DEFAULT_DELAY_MS;
}
