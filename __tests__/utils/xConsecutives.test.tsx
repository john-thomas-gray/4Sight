import xConsecutives from "@/utils/xConsecutives";

describe("xConsecutives", () => {
  it("given an empty board returns empty arrays", () => {
    const board = {};
    const result = xConsecutives({ boardPieces: board, X: 3 });
    expect(result.winners).toEqual([]);
    expect(result.almosts).toEqual([]);
    expect(result.winNextTurns).toEqual([]);
  });
});
