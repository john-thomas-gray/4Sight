import { BOARD_SIZE, Coord, Direction, Piece, Team, PIECES_PER_TEAM } from "./types";

export function coordToKey(c: Coord): string {
  return `${c.row}-${c.col}`;
}

export function keyToCoord(key: string): Coord {
  const [row, col] = key.split("-").map(Number);
  return { row, col };
}

export function isPlayable(c: Coord): boolean {
  return c.row >= 1 && c.row <= BOARD_SIZE && c.col >= 1 && c.col <= BOARD_SIZE;
}

export function isSlot(c: Coord): boolean {
  const onEdge =
    c.row === 0 || c.row === BOARD_SIZE + 1 ||
    c.col === 0 || c.col === BOARD_SIZE + 1;
  if (!onEdge) return false;
  const isCorner =
    (c.row === 0 || c.row === BOARD_SIZE + 1) &&
    (c.col === 0 || c.col === BOARD_SIZE + 1);
  return !isCorner;
}

/**
 * Given a slot coordinate on the board edge, returns the direction
 * a piece would travel when entering the board from that slot.
 * Returns null if the coordinate is not a valid slot.
 */
export function getSlotEntryDirection(slot: Coord): Direction | null {
  if (!isSlot(slot)) return null;
  if (slot.row === 0) return Direction.Down;
  if (slot.row === BOARD_SIZE + 1) return Direction.Up;
  if (slot.col === 0) return Direction.Right;
  if (slot.col === BOARD_SIZE + 1) return Direction.Left;
  return null;
}

const DIRECTION_DELTA: Record<Direction, Coord> = {
  [Direction.Up]: { row: -1, col: 0 },
  [Direction.Down]: { row: 1, col: 0 },
  [Direction.Left]: { row: 0, col: -1 },
  [Direction.Right]: { row: 0, col: 1 },
};

/**
 * Resolves where a piece lands when dropped into a slot.
 * Walks inward from the slot until hitting an occupied cell or the far edge.
 * Returns the landing coordinate, or null if the column/row is full.
 */
export function resolveSlotDrop(
  board: Readonly<Record<string, string>>,
  slot: Coord,
): Coord | null {
  const dir = getSlotEntryDirection(slot);
  if (!dir) return null;

  const delta = DIRECTION_DELTA[dir];
  let current: Coord = { row: slot.row + delta.row, col: slot.col + delta.col };
  let landing: Coord | null = null;

  while (isPlayable(current)) {
    const key = coordToKey(current);
    if (board[key] !== undefined) break;
    landing = current;
    current = { row: current.row + delta.row, col: current.col + delta.col };
  }

  return landing;
}

/**
 * First occupied cell along the slot entry path (toward the board).
 * Used when the column/row is full (`resolveSlotDrop` is null) to find
 * the piece that blocks a drop from this slot.
 */
export function getFirstOccupiedInSlotPath(
  board: Readonly<Record<string, string>>,
  slot: Coord,
): { coord: Coord; pieceId: string } | null {
  const dir = getSlotEntryDirection(slot);
  if (!dir) return null;
  const delta = DIRECTION_DELTA[dir];
  let current: Coord = { row: slot.row + delta.row, col: slot.col + delta.col };
  while (isPlayable(current)) {
    const key = coordToKey(current);
    const pieceId = board[key];
    if (pieceId !== undefined) {
      return { coord: current, pieceId };
    }
    current = { row: current.row + delta.row, col: current.col + delta.col };
  }
  return null;
}

/**
 * Given a target space on the board, finds the nearest slot that would
 * cause a piece to land on that space (via resolveSlotDrop).
 * Returns null if the space is occupied or no slot can reach it.
 */
export function findSlotForSpace(
  board: Readonly<Record<string, string>>,
  target: Coord,
): Coord | null {
  if (!isPlayable(target)) return null;
  if (board[coordToKey(target)] !== undefined) return null;

  const FRAME = BOARD_SIZE + 1;
  const candidates: { slot: Coord; distance: number }[] = [
    { slot: { row: 0, col: target.col }, distance: target.row },
    { slot: { row: FRAME, col: target.col }, distance: FRAME - target.row },
    { slot: { row: target.row, col: 0 }, distance: target.col },
    { slot: { row: target.row, col: FRAME }, distance: FRAME - target.col },
  ];

  let best: Coord | null = null;
  let bestDist = Infinity;

  for (const { slot, distance } of candidates) {
    if (!isSlot(slot)) continue;
    const landing = resolveSlotDrop(board, slot);
    if (
      landing &&
      landing.row === target.row &&
      landing.col === target.col &&
      distance < bestDist
    ) {
      best = slot;
      bestDist = distance;
    }
  }

  return best;
}

export function createEmptyBoard(): Record<string, string> {
  return {};
}

export function createPieces(): Record<string, Piece> {
  const pieces: Record<string, Piece> = {};
  for (let i = 0; i < PIECES_PER_TEAM; i++) {
    const id = String(i);
    pieces[id] = { id, team: Team.One };
  }
  for (let i = 0; i < PIECES_PER_TEAM; i++) {
    const id = String(PIECES_PER_TEAM + i);
    pieces[id] = { id, team: Team.Two };
  }
  return pieces;
}
