import { coordToKey, isPlayable, keyToCoord } from "./board";
import { BOARD_SIZE, Coord, Direction, PieceMove } from "./types";

type GravityResult = {
  board: Record<string, string>;
  moves: PieceMove[];
};

/**
 * Applies gravity in the given direction: all pieces slide until
 * they hit the board edge or another piece. Returns a new board
 * state and the list of piece movements.
 */
export function applyGravity(
  board: Readonly<Record<string, string>>,
  direction: Direction,
): GravityResult {
  const updated: Record<string, string> = { ...board };
  const moves: PieceMove[] = [];

  const iterate = (outerRange: number[], innerRange: number[], toCoord: (outer: number, inner: number) => Coord) => {
    for (const outer of outerRange) {
      for (const inner of innerRange) {
        const coord = toCoord(outer, inner);
        const key = coordToKey(coord);
        const pieceId = updated[key];
        if (pieceId === undefined) continue;

        const target = slideInDirection(updated, coord, direction);
        const targetKey = coordToKey(target);
        if (targetKey !== key) {
          moves.push({ pieceId, from: coord, to: target });
          delete updated[key];
          updated[targetKey] = pieceId;
        }
      }
    }
  };

  switch (direction) {
    case Direction.Up:
      iterate(
        range(1, BOARD_SIZE),
        range(1, BOARD_SIZE),
        (row, col) => ({ row, col }),
      );
      break;
    case Direction.Down:
      iterate(
        range(BOARD_SIZE, 1),
        range(1, BOARD_SIZE),
        (row, col) => ({ row, col }),
      );
      break;
    case Direction.Left:
      iterate(
        range(1, BOARD_SIZE),
        range(1, BOARD_SIZE),
        (col, row) => ({ row, col }),
      );
      break;
    case Direction.Right:
      iterate(
        range(BOARD_SIZE, 1),
        range(1, BOARD_SIZE),
        (col, row) => ({ row, col }),
      );
      break;
  }

  return { board: updated, moves };
}

function slideInDirection(
  board: Record<string, string>,
  from: Coord,
  direction: Direction,
): Coord {
  const delta = DIRECTION_DELTA[direction];
  let current = from;

  while (true) {
    const next: Coord = { row: current.row + delta.row, col: current.col + delta.col };
    if (!isPlayable(next)) break;
    if (board[coordToKey(next)] !== undefined) break;
    current = next;
  }

  return current;
}

const DIRECTION_DELTA: Record<Direction, Coord> = {
  [Direction.Up]: { row: -1, col: 0 },
  [Direction.Down]: { row: 1, col: 0 },
  [Direction.Left]: { row: 0, col: -1 },
  [Direction.Right]: { row: 0, col: 1 },
};

function range(from: number, to: number): number[] {
  const result: number[] = [];
  if (from <= to) {
    for (let i = from; i <= to; i++) result.push(i);
  } else {
    for (let i = from; i >= to; i--) result.push(i);
  }
  return result;
}
