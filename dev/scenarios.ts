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
};

export function getScenario(name: string): Scenario | undefined {
  return scenarios[name];
}

export function getScenarioDelay(scenario: Scenario): number {
  return scenario.delayMs ?? DEFAULT_DELAY_MS;
}
