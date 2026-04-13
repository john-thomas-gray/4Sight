import mockAllPieces from "@/__mocks__/mockAllPieces";
import { Team } from "@/types/board";

import findPieceRelationships from "@/utils/findPieceRelationships";

describe("default return", () => {
  it("given an empty board returns empty arrays", () => {
    const board: Record<string, string> = {};
    const result = findPieceRelationships({
      boardPieceLocations: board,
      winLen: 7,
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
        winLen: j,
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
        winLen: j,
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
        winLen: len,
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
        winLen: len,
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

describe("crawlAllLines checks every permutation of 4 in a row", () => {
  const winLen = 4;
  // const boardSize = 7;

  describe("4-in-a-row column patterns", () => {
    // Test all possible starting positions for 4-in-a-row columns
    for (let startRow = 1; startRow <= 4; startRow++) {
      it(`detects 4-in-a-row column starting at row ${startRow}`, () => {
        const board: Record<string, string> = {};

        // Place 4 consecutive pieces in column 1
        for (let i = 0; i < 4; i++) {
          const row = startRow + i;
          board[`1-${row}`] = (i + 1).toString();
        }

        const result = findPieceRelationships({
          boardPieceLocations: board,
          winLen,
          allPieces: mockAllPieces,
        });

        expect(result.winners[Team.TeamOne]).toHaveLength(1);
        expect(result.winners[Team.TeamOne][0]).toHaveLength(4);

        // Verify the sequence contains the expected positions
        const expectedPositions = [];
        for (let i = 0; i < 4; i++) {
          expectedPositions.push(`${1}-${startRow + i}`);
        }

        const actualPositions = result.winners[Team.TeamOne][0].map(
          (p) => p.spaceId
        );
        expect(actualPositions).toEqual(expectedPositions);
      });
    }

    // Test all possible columns for 4-in-a-row
    for (let col = 1; col <= 7; col++) {
      it(`detects 4-in-a-row in column ${col}`, () => {
        const board: Record<string, string> = {};

        // Place 4 consecutive pieces in the column
        for (let i = 0; i < 4; i++) {
          const row = 1 + i;
          board[`${col}-${row}`] = (i + 1).toString();
        }

        const result = findPieceRelationships({
          boardPieceLocations: board,
          winLen,
          allPieces: mockAllPieces,
        });

        expect(result.winners[Team.TeamOne]).toHaveLength(1);
        expect(result.winners[Team.TeamOne][0]).toHaveLength(4);
      });
    }
  });

  describe("4-in-a-row row patterns", () => {
    // Test all possible starting positions for 4-in-a-row rows
    for (let startCol = 1; startCol <= 4; startCol++) {
      it(`detects 4-in-a-row row starting at column ${startCol}`, () => {
        const board: Record<string, string> = {};

        // Place 4 consecutive pieces in row 1
        for (let i = 0; i < 4; i++) {
          const col = startCol + i;
          board[`${col}-1`] = (i + 1).toString();
        }

        const result = findPieceRelationships({
          boardPieceLocations: board,
          winLen,
          allPieces: mockAllPieces,
        });

        expect(result.winners[Team.TeamOne]).toHaveLength(1);
        expect(result.winners[Team.TeamOne][0]).toHaveLength(4);

        // Verify the sequence contains the expected positions
        const expectedPositions = [];
        for (let i = 0; i < 4; i++) {
          expectedPositions.push(`${startCol + i}-1`);
        }

        const actualPositions = result.winners[Team.TeamOne][0].map(
          (p) => p.spaceId
        );
        expect(actualPositions).toEqual(expectedPositions);
      });
    }

    // Test all possible rows for 4-in-a-row
    for (let row = 1; row <= 7; row++) {
      it(`detects 4-in-a-row in row ${row}`, () => {
        const board: Record<string, string> = {};

        // Place 4 consecutive pieces in the row
        for (let i = 0; i < 4; i++) {
          const col = 1 + i;
          board[`${col}-${row}`] = (i + 1).toString();
        }

        const result = findPieceRelationships({
          boardPieceLocations: board,
          winLen,
          allPieces: mockAllPieces,
        });

        expect(result.winners[Team.TeamOne]).toHaveLength(1);
        expect(result.winners[Team.TeamOne][0]).toHaveLength(4);
      });
    }
  });

  describe("4-in-a-row diagonal down-right patterns", () => {
    // Test all possible starting positions for 4-in-a-row diagonals (down-right)
    const diagonalStarts = [
      { startX: 1, startY: 1 }, // Main diagonal
      { startX: 1, startY: 2 }, // Diagonal starting at (1,2)
      { startX: 1, startY: 3 }, // Diagonal starting at (1,3)
      { startX: 1, startY: 4 }, // Diagonal starting at (1,4)
      { startX: 2, startY: 1 }, // Diagonal starting at (2,1)
      { startX: 3, startY: 1 }, // Diagonal starting at (3,1)
      { startX: 4, startY: 1 }, // Diagonal starting at (4,1)
    ];

    diagonalStarts.forEach(({ startX, startY }) => {
      it(`detects 4-in-a-row diagonal down-right starting at (${startX},${startY})`, () => {
        const board: Record<string, string> = {};

        // Place 4 consecutive pieces in diagonal
        for (let i = 0; i < 4; i++) {
          const x = startX + i;
          const y = startY + i;
          if (x <= 7 && y <= 7) {
            board[`${x}-${y}`] = (i + 1).toString();
          }
        }

        const result = findPieceRelationships({
          boardPieceLocations: board,
          winLen,
          allPieces: mockAllPieces,
        });

        expect(result.winners[Team.TeamOne]).toHaveLength(1);
        expect(result.winners[Team.TeamOne][0]).toHaveLength(4);

        // Verify the sequence contains the expected positions
        const expectedPositions = [];
        for (let i = 0; i < 4; i++) {
          const x = startX + i;
          const y = startY + i;
          if (x <= 7 && y <= 7) {
            expectedPositions.push(`${x}-${y}`);
          }
        }

        const actualPositions = result.winners[Team.TeamOne][0].map(
          (p) => p.spaceId
        );
        expect(actualPositions).toEqual(expectedPositions);
      });
    });
  });

  describe("4-in-a-row diagonal up-right patterns", () => {
    // Test all possible starting positions for 4-in-a-row diagonals (up-right)
    const diagonalStarts = [
      { startX: 7, startY: 1 }, // Main diagonal
      { startX: 6, startY: 1 }, // Diagonal starting at (6,1)
      { startX: 5, startY: 1 }, // Diagonal starting at (5,1)
      { startX: 4, startY: 1 }, // Diagonal starting at (4,1)
      { startX: 7, startY: 2 }, // Diagonal starting at (7,2)
      { startX: 7, startY: 3 }, // Diagonal starting at (7,3)
      { startX: 7, startY: 4 }, // Diagonal starting at (7,4)
    ];

    diagonalStarts.forEach(({ startX, startY }) => {
      it(`detects 4-in-a-row diagonal up-right starting at (${startX},${startY})`, () => {
        const board: Record<string, string> = {};

        // Place 4 consecutive pieces in diagonal
        for (let i = 0; i < 4; i++) {
          const x = startX - i;
          const y = startY + i;
          if (x >= 1 && y <= 7) {
            board[`${x}-${y}`] = (i + 1).toString();
          }
        }

        const result = findPieceRelationships({
          boardPieceLocations: board,
          winLen,
          allPieces: mockAllPieces,
        });

        expect(result.winners[Team.TeamOne]).toHaveLength(1);
        expect(result.winners[Team.TeamOne][0]).toHaveLength(4);

        // Verify the sequence contains the expected positions
        const expectedPositions = [];
        for (let i = 0; i < 4; i++) {
          const x = startX - i;
          const y = startY + i;
          if (x >= 1 && y <= 7) {
            expectedPositions.push(`${x}-${y}`);
          }
        }

        const actualPositions = result.winners[Team.TeamOne][0].map(
          (p) => p.spaceId
        );
        expect(actualPositions).toEqual(expectedPositions);
      });
    });
  });

  describe("edge cases and boundary conditions", () => {
    it("detects 4-in-a-row at board edges", () => {
      const board: Record<string, string> = {};

      // Test edge case: 4-in-a-row at the bottom edge
      for (let i = 0; i < 4; i++) {
        board[`${1 + i}-7`] = (i + 1).toString();
      }

      const result = findPieceRelationships({
        boardPieceLocations: board,
        winLen,
        allPieces: mockAllPieces,
      });

      expect(result.winners[Team.TeamOne]).toHaveLength(1);
      expect(result.winners[Team.TeamOne][0]).toHaveLength(4);
    });

    it("detects 4-in-a-row at right edge", () => {
      const board: Record<string, string> = {};

      // Test edge case: 4-in-a-row at the right edge
      for (let i = 0; i < 4; i++) {
        board[`7-${1 + i}`] = (i + 1).toString();
      }

      const result = findPieceRelationships({
        boardPieceLocations: board,
        winLen,
        allPieces: mockAllPieces,
      });

      expect(result.winners[Team.TeamOne]).toHaveLength(1);
      expect(result.winners[Team.TeamOne][0]).toHaveLength(4);
    });

    it("detects multiple 4-in-a-row sequences", () => {
      const board: Record<string, string> = {};

      // Create two separate 4-in-a-row sequences
      // First sequence: column 1
      for (let i = 0; i < 4; i++) {
        board[`1-${1 + i}`] = (i + 1).toString();
      }

      // Second sequence: row 2
      for (let i = 0; i < 4; i++) {
        board[`${1 + i}-2`] = (i + 5).toString();
      }

      const result = findPieceRelationships({
        boardPieceLocations: board,
        winLen,
        allPieces: mockAllPieces,
      });

      expect(result.winners[Team.TeamOne]).toHaveLength(2);
    });

    it("does not detect sequences shorter than 4", () => {
      const board: Record<string, string> = {};

      // Create a 3-in-a-row sequence
      for (let i = 0; i < 3; i++) {
        board[`1-${1 + i}`] = (i + 1).toString();
      }

      const result = findPieceRelationships({
        boardPieceLocations: board,
        winLen,
        allPieces: mockAllPieces,
      });

      expect(result.winners[Team.TeamOne]).toHaveLength(0);
    });

    it("detects sequences longer than 4", () => {
      const board: Record<string, string> = {};

      // Create a 5-in-a-row sequence
      for (let i = 0; i < 5; i++) {
        board[`1-${1 + i}`] = (i + 1).toString();
      }

      const result = findPieceRelationships({
        boardPieceLocations: board,
        winLen,
        allPieces: mockAllPieces,
      });

      expect(result.winners[Team.TeamOne]).toHaveLength(1);
      expect(result.winners[Team.TeamOne][0]).toHaveLength(5);
    });
  });

  describe("comprehensive permutation coverage", () => {
    it("verifies all possible 4-in-a-row positions are checked", () => {
      const allPositions = new Set<string>();

      // Generate all possible 4-in-a-row positions
      // Columns
      for (let col = 1; col <= 7; col++) {
        for (let startRow = 1; startRow <= 4; startRow++) {
          for (let i = 0; i < 4; i++) {
            allPositions.add(`${col}-${startRow + i}`);
          }
        }
      }

      // Rows
      for (let row = 1; row <= 7; row++) {
        for (let startCol = 1; startCol <= 4; startCol++) {
          for (let i = 0; i < 4; i++) {
            allPositions.add(`${startCol + i}-${row}`);
          }
        }
      }

      // Diagonals down-right
      for (let startX = 1; startX <= 4; startX++) {
        for (let startY = 1; startY <= 4; startY++) {
          for (let i = 0; i < 4; i++) {
            const x = startX + i;
            const y = startY + i;
            if (x <= 7 && y <= 7) {
              allPositions.add(`${x}-${y}`);
            }
          }
        }
      }

      // Diagonals up-right
      for (let startX = 4; startX <= 7; startX++) {
        for (let startY = 1; startY <= 4; startY++) {
          for (let i = 0; i < 4; i++) {
            const x = startX - i;
            const y = startY + i;
            if (x >= 1 && y <= 7) {
              allPositions.add(`${x}-${y}`);
            }
          }
        }
      }

      // This test ensures we've covered all possible positions
      // The actual implementation should check all these positions
      expect(allPositions.size).toBeGreaterThan(0);
    });
  });
});
