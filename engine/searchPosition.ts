import { BOARD_SIZE, Direction, GameState, Team, WIN_LENGTH } from "./types";
import type { GameMove } from "./moves";

/** Search-only representation. Differential tests keep it aligned with the public engine. */
export type SearchPosition = {
  cells: Uint8Array;
  reserves: [number, number];
  currentTeam: Team;
  status: GameState["status"];
  winner: Team | null;
  tie: boolean;
};
export type SearchMove =
  | { type: "place"; slot: { row: number; col: number }; landing: number }
  | { type: "pull"; direction: Direction };
export type SearchTransition = { move: SearchMove; state: SearchPosition };
export const teamNumber = (team: Team) => team === Team.One ? 1 : 2;
const index = (row: number, col: number) => (row - 1) * BOARD_SIZE + col - 1;
export const SEARCH_WINDOWS: number[][] = [];
for (let row = 1; row <= BOARD_SIZE; row++) {
  for (let col = 1; col <= BOARD_SIZE; col++) {
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      const endRow = row + dr * (WIN_LENGTH - 1);
      const endCol = col + dc * (WIN_LENGTH - 1);
      if (endRow < 1 || endRow > BOARD_SIZE || endCol < 1 || endCol > BOARD_SIZE) continue;
      SEARCH_WINDOWS.push(Array.from({ length: WIN_LENGTH }, (_, i) => index(row + i * dr, col + i * dc)));
    }
  }
}
const entries: { slot: { row: number; col: number }; path: number[] }[] = [];
const gravityPaths: Record<Direction, number[][]> = { up: [], down: [], left: [], right: [] };
for (let lane = 1; lane <= BOARD_SIZE; lane++) {
  const column = Array.from({ length: BOARD_SIZE }, (_, i) => index(i + 1, lane));
  const row = Array.from({ length: BOARD_SIZE }, (_, i) => index(lane, i + 1));
  entries.push(
    { slot: { row: 0, col: lane }, path: column },
    { slot: { row: BOARD_SIZE + 1, col: lane }, path: [...column].reverse() },
    { slot: { row: lane, col: 0 }, path: row },
    { slot: { row: lane, col: BOARD_SIZE + 1 }, path: [...row].reverse() },
  );
  gravityPaths.up.push(column);
  gravityPaths.down.push([...column].reverse());
  gravityPaths.left.push(row);
  gravityPaths.right.push([...row].reverse());
}

export function toSearchPosition(state: GameState): SearchPosition {
  const cells = new Uint8Array(BOARD_SIZE * BOARD_SIZE);
  const reserves: [number, number] = [0, 0];
  for (const piece of Object.values(state.pieces)) reserves[teamNumber(piece.team) - 1]++;
  for (const [key, id] of Object.entries(state.board)) {
    const [row, col] = key.split("-").map(Number);
    const team = teamNumber(state.pieces[id].team);
    cells[index(row, col)] = team;
    reserves[team - 1]--;
  }
  return { cells, reserves, currentTeam: state.currentTeam, status: state.status, winner: state.winner, tie: state.tie };
}

export function searchPositionKey(state: SearchPosition): string {
  return `${state.currentTeam}:${state.status}:${state.winner}:${state.tie}:${state.reserves.join(",")}:` + String.fromCharCode(...state.cells);
}

function finishMove(state: SearchPosition, cells: Uint8Array, reserves: [number, number]): SearchPosition {
  let winners = 0;
  for (const line of SEARCH_WINDOWS) {
    const team = cells[line[0]];
    if (team && line.every(cell => cells[cell] === team)) winners |= team;
  }
  const tie = winners === 3;
  return { cells, reserves, tie, winner: winners === 1 ? Team.One : winners === 2 ? Team.Two : null,
    status: winners ? "finished" : "playing",
    currentTeam: winners ? state.currentTeam : state.currentTeam === Team.One ? Team.Two : Team.One };
}

export function searchTransitions(state: SearchPosition): SearchTransition[] {
  if (state.status !== "playing") return [];
  const result: SearchTransition[] = [];
  const team = teamNumber(state.currentTeam);
  if (state.reserves[team - 1] > 0) {
    const seen = new Set<number>();
    for (const { slot, path } of entries) {
      let landing = -1;
      for (const cell of path) {
        if (state.cells[cell]) break;
        landing = cell;
      }
      if (landing < 0 || seen.has(landing)) continue;
      seen.add(landing);
      const cells = state.cells.slice();
      cells[landing] = team;
      const reserves: [number, number] = [...state.reserves];
      reserves[team - 1]--;
      result.push({ move: { type: "place", slot, landing }, state: finishMove(state, cells, reserves) });
    }
  }
  const seenPulls = new Set<string>();
  for (const direction of Object.values(Direction)) {
    const cells = new Uint8Array(state.cells.length);
    for (const path of gravityPaths[direction]) {
      let target = 0;
      for (const cell of path) if (state.cells[cell]) cells[path[target++]] = state.cells[cell];
    }
    if (cells.every((value, cell) => value === state.cells[cell])) continue;
    const key = String.fromCharCode(...cells);
    if (seenPulls.has(key)) continue;
    seenPulls.add(key);
    result.push({ move: { type: "pull", direction }, state: finishMove(state, cells, state.reserves) });
  }
  return result;
}

export function toGameMove(state: GameState, move: SearchMove): GameMove {
  if (move.type === "pull") return move;
  const used = new Set(Object.values(state.board));
  const piece = Object.values(state.pieces).find(p => p.team === state.currentTeam && !used.has(p.id));
  if (!piece) throw new Error("Search selected a placement without a reserve piece");
  return { type: "place", slot: move.slot, pieceId: piece.id };
}
