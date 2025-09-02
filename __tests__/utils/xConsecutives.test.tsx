import mockAllPieces from "@/__mocks__/mockAllPieces";
import { Capturer } from "@/types/board";
import xConsecutives from "@/utils/xConsecutives";

describe("xConsecutives", () => {
  it("given an empty board returns empty arrays", () => {
    const board = {};
    const result = xConsecutives({ boardPieces: board, X: 4, mockAllPieces });
    expect(result.winners).toEqual([]);
    expect(result.almosts).toEqual([]);
    expect(result.winNextTurns).toEqual({
      [Capturer.TeamOne]: [],
      [Capturer.TeamTwo]: [],
      [Capturer.Neutral]: [],
    });
  });
});

describe("horizontal winning sequences for each possible", () => {
  const board = {
    "1-1": "1",
    "2-1": "2",
    "3-1": "3",
    "4-1": "4",
    "5-1": "5",
    "6-1": "6",
    "7-1": "7",
  };

  for (let X = 1; X <= 7; X++) {
    it(`detects a horizontal winning sequence of length ${X}`, () => {
      const result = xConsecutives({
        boardPieces: board,
        X,
        allPieces: mockAllPieces,
      });
      expect(result.winners.length).toBe(1);
      const expectedSequence: Record<string, string> = {};
      for (let i = 1; i <= X; i++) {
        expectedSequence[`${i}-1`] = "1";
      }
      expect(result.winners[0][Capturer.TeamOne]).toEqual(expectedSequence);
    });
  }
});
