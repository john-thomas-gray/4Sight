import { coordToKey, resolveSlotDrop } from "./board";
import { placePiece, shiftGravity } from "./game";
import { applyGravity } from "./gravity";
import { BOARD_SIZE, Coord, Direction, GameState } from "./types";

export type GameMove =
  | { type: "place"; slot: Coord; pieceId: string }
  | { type: "pull"; direction: Direction };

/** Equivalent entry slots share one landing square; pieces of one team are interchangeable. */
export function legalMoves(state: GameState): GameMove[] {
  if (state.status !== "playing") return [];
  const used = new Set(Object.values(state.board));
  const piece = Object.values(state.pieces).find(p => p.team === state.currentTeam && !used.has(p.id));
  const moves: GameMove[] = [];
  if (piece) {
    const landings = new Set<string>();
    for (let lane = 1; lane <= BOARD_SIZE; lane++) {
      for (const slot of [
        { row: 0, col: lane }, { row: BOARD_SIZE + 1, col: lane },
        { row: lane, col: 0 }, { row: lane, col: BOARD_SIZE + 1 },
      ]) {
        const landing = resolveSlotDrop(state.board, slot);
        if (!landing || landings.has(coordToKey(landing))) continue;
        landings.add(coordToKey(landing));
        moves.push({ type: "place", slot, pieceId: piece.id });
      }
    }
  }
  for (const direction of Object.values(Direction)) {
    if (applyGravity(state.board, direction).moves.length > 0) moves.push({ type: "pull", direction });
  }
  return moves;
}

export function applyMove(state: GameState, move: GameMove): GameState {
  return (move.type === "place"
    ? placePiece(state, move.slot, move.pieceId)
    : shiftGravity(state, move.direction)).state;
}
