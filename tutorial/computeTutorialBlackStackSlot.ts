import {
  BOARD_SIZE,
  Direction,
  PIECES_PER_TEAM,
  getSlotEntryDirection,
  isSlot,
  keyToCoord,
  resolveSlotDrop,
} from "@/engine";

const ENTRY_DELTA: Record<Direction, Coord> = {
  [Direction.Up]: { row: -1, col: 0 },
  [Direction.Down]: { row: 1, col: 0 },
  [Direction.Left]: { row: 0, col: -1 },
  [Direction.Right]: { row: 0, col: 1 },
};

/**
 * Finds an edge slot from which a drop would stack immediately above / beside
 * `whitePieceId` along the entry ray (same rule as {@link resolveSlotDrop}).
 * Prefers an entry direction different from `avoidEntryDirection` when possible.
 */
export function findTutorialBlackStackSlotAboveWhite(
  board: Readonly<Record<string, string>>,
  whitePieceId: string,
  avoidEntryDirection: Direction | null,
): Coord | null {
  const whiteKey = Object.entries(board).find(
    ([, id]) => id === whitePieceId,
  )?.[0];
  if (!whiteKey) return null;
  const whiteCoord = keyToCoord(whiteKey);
  const frame = BOARD_SIZE + 1;
  const candidates: Coord[] = [
    { row: 0, col: whiteCoord.col },
    { row: frame, col: whiteCoord.col },
    { row: whiteCoord.row, col: 0 },
    { row: whiteCoord.row, col: frame },
  ].filter((s) => isSlot(s));

  const trySlots = (strictAvoid: boolean): Coord | null => {
    for (const slot of candidates) {
      const dir = getSlotEntryDirection(slot);
      if (!dir) continue;
      if (
        strictAvoid &&
        avoidEntryDirection != null &&
        dir === avoidEntryDirection
      ) {
        continue;
      }
      const landing = resolveSlotDrop(board, slot);
      if (!landing) continue;
      const d = ENTRY_DELTA[dir];
      if (
        whiteCoord.row === landing.row + d.row &&
        whiteCoord.col === landing.col + d.col
      ) {
        return slot;
      }
    }
    return null;
  };

  return trySlots(true) ?? trySlots(false);
}

/** Smallest numeric id ≥ {@link PIECES_PER_TEAM} present in well values. */
export function pickLowestBlackPieceIdInWells(
  wellPieceLocations: Readonly<Record<string, string>>,
): string | undefined {
  let min = Infinity;
  let best: string | undefined;
  for (const pid of Object.values(wellPieceLocations)) {
    const n = Number(pid);
    if (Number.isNaN(n) || n < PIECES_PER_TEAM) continue;
    if (n < min) {
      min = n;
      best = pid;
    }
  }
  return best;
}
