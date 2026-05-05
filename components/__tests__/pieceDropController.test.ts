import { Direction } from "@/engine";
import { resolveDropOutcome } from "../pieceDropController";

function boardFrom(entries: [string, string][]): Record<string, string> {
  return Object.fromEntries(entries);
}

const slotIds: Record<string, unknown> = { "0-4": 1 };
const spaceIds: Record<string, unknown> = { "4-4": 1, "2-4": 1 };
const wellIds: Record<string, unknown> = { "well-1": 1 };
const ORIGIN_WELL = "well-0";

describe("piece retains origin well until placed successfully", () => {
  it("blocked slot → blockedSlot outcome with first piece on path", () => {
    const board = boardFrom([["1-4", "blocker"]]);
    const outcome = resolveDropOutcome("0-4", board, slotIds, spaceIds, wellIds, {}, ORIGIN_WELL);
    expect(outcome).toEqual({
      kind: "blockedSlot",
      slotCoord: { row: 0, col: 4 },
      blockingPieceId: "blocker",
      blockingKey: "1-4",
      entryDirection: Direction.Down,
    });
  });

  it("unreachable space (all axes blocked) → returns to origin well", () => {
    const board = boardFrom([
      ["3-4", "a"],
      ["5-4", "b"],
      ["4-3", "c"],
      ["4-5", "d"],
    ]);
    const outcome = resolveDropOutcome("4-4", board, slotIds, spaceIds, wellIds, {}, ORIGIN_WELL);
    expect(outcome).toEqual({ kind: "returnToWell", originWellId: ORIGIN_WELL });
  });

  it("occupied space → returns to origin well", () => {
    const board = boardFrom([["4-4", "occupant"]]);
    const outcome = resolveDropOutcome("4-4", board, slotIds, spaceIds, wellIds, {}, ORIGIN_WELL);
    expect(outcome).toEqual({ kind: "returnToWell", originWellId: ORIGIN_WELL });
  });

  it("dropped outside board/well (unknown cell) → returns to origin well", () => {
    const outcome = resolveDropOutcome("99-99", {}, slotIds, spaceIds, wellIds, {}, ORIGIN_WELL);
    expect(outcome).toEqual({ kind: "returnToWell", originWellId: ORIGIN_WELL });
  });

  it("occupied well cell → returns to origin well", () => {
    const occupied = { "well-1": "otherPiece" };
    const outcome = resolveDropOutcome("well-1", {}, slotIds, spaceIds, wellIds, occupied, ORIGIN_WELL);
    expect(outcome).toEqual({ kind: "returnToWell", originWellId: ORIGIN_WELL });
  });

  it("tutorial-inaccessible slot edge → returns to origin well", () => {
    const outcome = resolveDropOutcome(
      "0-4",
      {},
      slotIds,
      spaceIds,
      wellIds,
      {},
      ORIGIN_WELL,
      Direction.Down,
    );

    expect(outcome).toEqual({
      kind: "returnToWell",
      originWellId: ORIGIN_WELL,
    });
  });
});

describe("successful placements", () => {
  it("clear slot → piece placed on board", () => {
    const board = boardFrom([["5-4", "x"]]);
    const outcome = resolveDropOutcome("0-4", board, slotIds, spaceIds, wellIds, {}, ORIGIN_WELL);
    expect(outcome.kind).toBe("placed");
    if (outcome.kind === "placed") {
      expect(outcome.slotCoord).toEqual({ row: 0, col: 4 });
      expect(outcome.landingKey).toBe("4-4");
    }
  });

  it("space drop with reachable slot → piece placed on target space", () => {
    const board = boardFrom([["3-4", "x"]]);
    const outcome = resolveDropOutcome("2-4", board, slotIds, spaceIds, wellIds, {}, ORIGIN_WELL);
    expect(outcome.kind).toBe("placed");
    if (outcome.kind === "placed") {
      expect(outcome.landingKey).toBe("2-4");
    }
  });

  it("space drop avoids a tutorial-inaccessible slot edge", () => {
    const board = boardFrom([
      ["5-4", "top-blocker"],
      ["4-5", "left-blocker"],
    ]);
    const outcome = resolveDropOutcome(
      "4-4",
      board,
      {
        "0-4": 1,
        "4-0": 1,
        "4-8": 1,
        "8-4": 1,
      },
      { "4-4": 1 },
      wellIds,
      {},
      ORIGIN_WELL,
      Direction.Down,
    );

    expect(outcome).toEqual({
      kind: "placed",
      slotCoord: { row: 4, col: 0 },
      landingKey: "4-4",
    });
  });

  it("empty well cell → piece moves to that well", () => {
    const outcome = resolveDropOutcome("well-1", {}, slotIds, spaceIds, wellIds, {}, ORIGIN_WELL);
    expect(outcome).toEqual({ kind: "well", wellId: "well-1" });
  });
});
