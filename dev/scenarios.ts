import type { Coord } from "@/engine";
import { Direction, Team } from "@/engine";
import { TUTORIAL_STEP_ONE_SOURCE_WELL_CELL_ID } from "@/tutorial/constants";

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
  /**
   * When true, `loadScenario` keeps the current board and only reapplies
   * well layout + piece statuses from the live board (tutorial hand-off).
   */
  continuation?: boolean;
};

const DEFAULT_DELAY_MS = 1200;

export const scenarios: Record<string, Scenario> = {
  nearWin: {
    board: {
      "3-3": "0",
      "3-4": "1",
      "3-5": "2",
      "3-1": "24",
      "3-2": "25",
    },
    currentTeam: Team.One,
    moves: [{ type: "place", targetSpace: { row: 3, col: 6 }, pieceId: "3" }],
    delayMs: 1500,
  },

  tripleWin: {
    board: {
      "4-1": "10",
      "4-2": "11",
      "4-3": "0",
      "4-5": "1",
      "4-6": "2",
      "4-7": "12",
      "5-4": "3",
      "6-4": "4",
      "7-4": "5",
      "5-5": "6",
      "6-6": "7",
      "6-7": "13",
      "7-7": "8",
      "1-1": "24",
      "1-2": "25",
      "1-6": "26",
      "7-2": "27",
    },
    currentTeam: Team.One,
    moves: [{ type: "place", targetSpace: { row: 4, col: 4 }, pieceId: "9" }],
    delayMs: 1500,
  },

  tieGame: {
    board: {
      "3-2": "0",
      "3-4": "1",
      "3-5": "2",
      "3-7": "3",
      "6-3": "4",
      "7-3": "5",
      "5-3": "24",
      "5-5": "25",
      "5-6": "26",
      "5-7": "27",
      "2-2": "28",
      "1-2": "29",
      "2-4": "30",
      "1-4": "31",
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
      "7-2": "3",
      "6-2": "4",
      "6-5": "5",
      "7-5": "6",
      "3-2": "24",
      "3-4": "25",
      "3-5": "26",
      "3-7": "27",
      "2-2": "28",
      "1-2": "29",
      "2-4": "30",
      "1-4": "31",
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
      [TUTORIAL_STEP_ONE_SOURCE_WELL_CELL_ID]: "0",
    },
  },

  /**
   * Tutorial step 2: continues from step 1; fills every well except the cell
   * that held piece `"0"` in step 1.
   */
  tutorialStep2: {
    continuation: true,
    board: {},
    /** White already moved; scripted black stack runs next. */
    currentTeam: Team.Two,
    moves: [],
  },
  tutorialNearWin: {
    board: {
      "4-1": "0",
      "5-1": "1",
      "6-1": "2",
      "7-4": "3",
      "7-5": "4",
      "7-6": "5",
      "2-4": "6",
      "3-5": "7",
      "4-6": "8",
      "3-1": "24",
      "7-3": "25",
      "1-3": "26",
      "5-6": "27",
      "1-4": "28",
      "1-7": "29",
      "3-6": "30",
      "6-4": "31",
      "3-7": "32",
    },
    currentTeam: Team.One,
    moves: [],
  },
  tutorialGravityNearWin: {
    board: {
      "1-2": "0",
      "3-1": "23",
      "7-3": "1",
      "7-4": "2",
      "7-5": "3",
      "7-7": "4",
      "6-3": "24",
      "6-4": "25",
      "6-5": "5",
      "5-4": "26",
      "5-5": "27",
      "4-5": "6",
      "4-7": "28",
    },
    currentTeam: Team.One,
    moves: [],
  },
  tutorialTightSpot: {
    board: {
      "1-3": "0",
      "5-7": "1",
      "5-6": "2",
      "6-3": "3",
      "7-7": "4",
      "5-4": "5",
      "4-6": "24",
      "5-5": "25",
      "2-4": "26",
      "3-6": "27",
      "6-4": "28",
      "2-3": "29",
    },
    currentTeam: Team.One,
    moves: [],
  },
};

export function getScenario(name: string): Scenario | undefined {
  return scenarios[name];
}

export function getScenarioDelay(scenario: Scenario): number {
  return scenario.delayMs ?? DEFAULT_DELAY_MS;
}
