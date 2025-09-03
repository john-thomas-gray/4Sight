import mockAllPieces from "@/__mocks__/mockAllPieces";
import { Team } from "@/types/board";

import findPieceRelationships from "@/utils/findPieceRelationships";

describe("default return", () => {
  it("given an empty board returns empty arrays", () => {
    const board: Record<string, string> = {};
    const result = findPieceRelationships({
      boardPieceLocations: board,
      j: 7,
      allPieces: mockAllPieces,
    });
    expect(result.winners).toEqual({ [Team.TeamOne]: [], [Team.TeamTwo]: [] });
    expect(result.partials).toEqual({ [Team.TeamOne]: [], [Team.TeamTwo]: [] });
    expect(result.winNextTurns).toEqual({
      [Team.TeamOne]: [],
      [Team.TeamTwo]: [],
    });
  });
});

describe("winning sequences for columns", () => {
  for (let j = 1; j <= 7; j++) {
    const board: Record<string, string> = {};
    for (let i = 1; i <= j; i++) {
      const key = `${i}-1`;
      const value = i.toString();
      board[key] = value;
    }

    it(`detects a column winning sequence of length ${j}`, () => {
      const result = findPieceRelationships({
        boardPieceLocations: board,
        j,
        allPieces: mockAllPieces,
      });

      // expect(result.winners[Team.TeamOne].length).toBe(1);

      const expectedSequence = [];
      for (let i = 1; i <= j; i++) {
        expectedSequence.push({ spaceId: `${i}-1`, pieceId: i.toString() });
      }

      expect(result.winners[Team.TeamOne][0]).toEqual(expectedSequence);
    });
  }
});

describe("it detects winning sequences in rows", () => {
  for (let j = 1; j <= 7; j++) {
    const board: Record<string, string> = {};
    for (let i = 1; i <= j; i++) {
      const key = `1-${i}`;
      const value = i.toString();
      board[key] = value;
    }
    // console.log(board);
    it(`detects a row winning sequence of length ${j}`, () => {
      const result = findPieceRelationships({
        boardPieceLocations: board,
        j,
        allPieces: mockAllPieces,
      });
      // console.log(result.winners[Team.TeamOne]);
      // expect(result.winners[Team.TeamOne].length).toBe(1);

      const expectedSequence = [];
      for (let i = 1; i <= j; i++) {
        expectedSequence.push({ spaceId: `1-${i}`, pieceId: i.toString() });
      }

      expect(result.winners[Team.TeamOne][0]).toEqual(expectedSequence);
    });
  }
});

describe("it detects winning sequences in diagonals down-right", () => {
  const diagonalLengths = [1, 2, 3, 4, 5, 6, 7];

  diagonalLengths.forEach((len) => {
    it(`detects a diagonal down-right winning sequence of length ${len}`, () => {
      const board: Record<string, string> = {};

      // build \ diagonal: 1-1, 2-2, 3-3, ...
      for (let i = 1; i <= len; i++) {
        const key = `${i}-${i}`;
        board[key] = i.toString();
      }
      // console.log("board", board);
      const result = findPieceRelationships({
        boardPieceLocations: board,
        j: len,
        allPieces: mockAllPieces,
      });
      // console.log("dv", result.winners[Team.TeamOne]);
      // expect(result.winners[Team.TeamOne].length).toBe(1);

      const expectedSequence = Array.from({ length: len }, (_, idx) => {
        const pos = idx + 1;
        return { spaceId: `${pos}-${pos}`, pieceId: pos.toString() };
      });

      expect(result.winners[Team.TeamOne][0]).toEqual(expectedSequence);
    });
  });
});
describe("it detects winning sequences in diagonals up right", () => {
  const diagonalLengths = [1, 2, 3, 4, 5, 6, 7];
  diagonalLengths.forEach((len) => {
    it(`detects a diagonal up-right winning sequence of length ${len}`, () => {
      const board: Record<string, string> = {};

      // build / diagonal: len-1, (len-1)-2, ...
      for (let i = 1; i <= len; i++) {
        const row = len - i + 1; // start from bottom row
        const col = i; // increasing column
        board[`${row}-${col}`] = i.toString();
      }

      const result = findPieceRelationships({
        boardPieceLocations: board,
        j: len,
        allPieces: mockAllPieces,
      });

      // expect(result.winners[Team.TeamOne].length).toBe(1);

      const expectedSequence = Array.from({ length: len }, (_, idx) => {
        const row = len - idx;
        const col = idx + 1;
        return { spaceId: `${row}-${col}`, pieceId: (idx + 1).toString() };
      });

      expect(result.winners[Team.TeamOne][0]).toEqual(expectedSequence);
    });
  });
});
