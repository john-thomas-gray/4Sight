import { findSlotForSpace, resolveSlotDrop, coordToKey } from "../index";
import type { Coord } from "../index";

function boardFrom(entries: [string, string][]): Record<string, string> {
  return Object.fromEntries(entries);
}

describe("findSlotForSpace", () => {
  it("returns null when the target space is occupied", () => {
    const board = boardFrom([["4-4", "x"]]);
    expect(findSlotForSpace(board, { row: 4, col: 4 })).toBeNull();
  });

  it("returns null when no slot can reach the target", () => {
    // Pieces on all 4 axes between target and each slot, so every
    // resolveSlotDrop lands short of the target.
    //
    //         col 4
    //  slot (0,4)
    //    blocker (3,4)
    //    TARGET  (4,4)
    //    blocker (5,4)
    //  slot (8,4)
    //
    //  row 4:  slot (4,0) → blocker (4,3) | TARGET | blocker (4,5) ← slot (4,8)
    const board = boardFrom([
      ["3-4", "a"],
      ["5-4", "b"],
      ["4-3", "c"],
      ["4-5", "d"],
    ]);
    expect(findSlotForSpace(board, { row: 4, col: 4 })).toBeNull();
  });

  it("finds the nearest slot when one direction is reachable", () => {
    // Piece at (5,4) blocks from below. Slot (0,4) walks down →
    // lands at (4,4) because (5,4) blocks. Distance to (0,4) is 4.
    const board = boardFrom([["5-4", "x"]]);
    const slot = findSlotForSpace(board, { row: 4, col: 4 });

    expect(slot).not.toBeNull();
    // Verify the chosen slot actually lands on the target.
    const landing = resolveSlotDrop(board, slot!);
    expect(landing).toEqual({ row: 4, col: 4 });
  });

  it("picks the closest slot when multiple slots can reach the target", () => {
    // Row 2, col 4:
    //   slot (0,4) → distance 2, walks down to (2,4) then blocked by (3,4)
    //   slot (8,4) → distance 6, walks up — lands at (4,4) ≠ target
    //   slot (2,0) → distance 4, walks right — all empty, lands at (2,7) ≠ target
    //   slot (2,8) → distance 6, walks left — all empty, lands at (2,1) ≠ target
    //
    // Only (0,4) reaches (2,4), so it must be chosen.
    const board = boardFrom([["3-4", "x"]]);
    const slot = findSlotForSpace(board, { row: 2, col: 4 });
    expect(slot).toEqual({ row: 0, col: 4 });
  });

  it("returns null for a non-playable coordinate", () => {
    expect(findSlotForSpace({}, { row: 0, col: 4 })).toBeNull();
  });
});
