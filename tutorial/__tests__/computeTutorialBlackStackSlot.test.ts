import { Direction } from "@/engine";
import {
  findTutorialBlackStackSlotAboveWhite,
  pickLowestBlackPieceIdInWells,
} from "@/tutorial/computeTutorialBlackStackSlot";

describe("findTutorialBlackStackSlotAboveWhite", () => {
  it("prefers a slot whose entry direction differs from the avoided direction", () => {
    const board = { "7-4": "0" };
    const slot = findTutorialBlackStackSlotAboveWhite(
      board,
      "0",
      Direction.Down,
    );
    expect(slot).toEqual({ row: 7, col: 0 });
  });

  it("returns a stacking slot when the avoided direction is not the only option", () => {
    const board = { "7-4": "0" };
    const slot = findTutorialBlackStackSlotAboveWhite(
      board,
      "0",
      Direction.Right,
    );
    expect(slot).not.toBeNull();
  });
});

describe("pickLowestBlackPieceIdInWells", () => {
  it("returns the smallest team-two id present", () => {
    const id = pickLowestBlackPieceIdInWells({
      "9-9": "0",
      "17-12": "24",
      "18-12": "30",
    });
    expect(id).toBe("24");
  });
});
