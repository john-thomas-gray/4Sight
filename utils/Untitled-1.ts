// # boardPieces is an object representing a 7x7 grid starting at index 1 and ending at index 7 (inclusive)
// # with spaces as keys and the pieces they contain, X is an int, cell is a space's coordinates (e.g. "4-4")

import { Capturer } from "@/types/board";

// # xConsecutive takes (boardPieces, X, cell?)

// # create a Map called consecutives containing three arrays:
// #   winners
// #   almosts
// #   almostEmpties

// # if no cell is input, we run the pull variation:

// # crawl a line along every row, then every column, then every diagonal (starting at spaces "4-1" and "4-7")
// # for each line, create a Map of the spaces in the line. If a X or more consecutive spaces
// # contain pieces of the same team, push a map of that sequence (team as the key, and a map of spaceids as keys and thier corresponding pieceIds as values)
// # to the winners array. Additionally, if a space preceeds or follows (X - 1) consecutive spaces containing pieces of the same team, unless those pieceIds
// # are part of a sequence of X or more, push a map of that sequence to almosts (team as the key, and a map of spaceids as keys and thier corresponding pieceIds as values).
// # Push the empty spaces to the almostEmpties array.
// # If, in the course of crawling a line, a sequence of (X - 1) consecutive pieces becomes impossible, continue

// # if cell is input, run the cell variation:

// # starting at the input cell,
// # check each direction (diagonally, horizontally and vertically)
// # for sequences of x or more consecutive spaces containing pieces of the same team.
// # check for sequences of (X - 1) preceeded or followed by an empty space.
// # (omit a check if it would extend out of bounds)
// # continue if a sequence of (X - 1) consecutive pieces becomes impossible

// # return consecutives

type xConsecutives = {
  boardPieces: Record<string, string>;
  X: number;
  cell: string;
};

const xConsecutives = ({ boardPieces, X, cell }: xConsecutives) => {
  const consecutives = new Map([
    ["winners", []],
    ["almosts", []],
    ["almostEmpties", []],
  ]);

  const SIZE = 7;

  const directions = [
    { name: "horizontal", dx: 1, dy: 0 },
    { name: "vertical", dx: 0, dy: 1 },
    { name: "diagDown", dx: 1, dy: 1 },
    { name: "diagUp", dx: 1, dy: -1 },
  ];

  const inBounds = ({ x, y }: { x: number; y: number }) =>
    x >= 1 && x <= SIZE && y >= 1 && y <= SIZE;
  const key = ({ x, y }: { x: number; y: number }) => `${x}-${y}`;

  function scanLine(spaces: any[]) {
    let run: any[] = [];
    let lastTeam: Capturer = Capturer.Neutral;

    const flushRun = () => {
      if (!run.length) return;
      const team = lastTeam;
      const piecesMap = new Map(run.map(([coord, piece]) => [coord, piece]));
      if (run.length >= X) {
        consecutives.get("winners")!.push(new Map([[team, piecesMap]]));
      } else if (run.length === X - 1) {
        const ends = [
          spaces[spaces.indexOf(run[0]) - 1],
          spaces[spaces.indexOf(run.at(-1)) + 1],
        ];
        const emptyEnds =
          ends?.filter(([coord]) => {
            const val = boardPieces[coord];
            return val == null;
          }) || [];
        if (emptyEnds.length) {
          consecutives.get("almosts").push(new Map([[team, piecesMap]]));
          consecutives
            .get("almostEmpties")
            .push(emptyEnds.map(([coord]) => coord));
        }
      }
      run = [];
    };

    for (const [coord, piece] of spaces) {
      if (!piece) {
        flushRun();
        lastTeam = null;
        continue;
      }
      if (piece.team === lastTeam) {
        run.push([coord, piece.id]);
      } else {
        flushRun();
        run = [[coord, piece.id]];
        lastTeam = piece.team;
      }
    }
    flushRun();
  }

  function crawlAllLines() {
    // Rows
    for (let y = 1; y <= SIZE; y++) {
      const spaces = [];
      for (let x = 1; x <= SIZE; x++)
        spaces.push([key(x, y), boardPieces[key(x, y)]]);
      scanLine(spaces);
    }

    // Columns
    for (let x = 1; x <= SIZE; x++) {
      const spaces = [];
      for (let y = 1; y <= SIZE; y++)
        spaces.push([key(x, y), boardPieces[key(x, y)]]);
      scanLine(spaces);
    }

    // Diagonals: starting "4-1" to "4-7" (down and up)
    for (let y = 1; y <= SIZE; y++) {
      const down = [];
      const up = [];
      for (let offset = -3; offset <= 3; offset++) {
        const x1 = 4 + offset;
        const y1 = y + offset;
        if (inBounds(x1, y1))
          down.push([key(x1, y1), boardPieces[key(x1, y1)]]);
        const x2 = 4 + offset;
        const y2 = y - offset;
        if (inBounds(x2, y2)) up.push([key(x2, y2), boardPieces[key(x2, y2)]]);
      }
      if (down.length >= X) scanLine(down);
      if (up.length >= X) scanLine(up);
    }
  }

  function crawlFromCell(cellCoord: string) {
    const [cx, cy] = cellCoord.split("-").map(Number);

    for (const { dx, dy } of directions) {
      const line = [];
      // go backward
      let x = cx;
      let y = cy;
      while (inBounds(x - dx, y - dy)) {
        x -= dx;
        y -= dy;
      }
      // walk forward along the line
      while (inBounds(x, y)) {
        line.push([key(x, y), boardPieces[key(x, y)]]);
        x += dx;
        y += dy;
      }
      if (line.length >= X) scanLine(line);
    }
  }

  // Main logic
  if (cell) {
    crawlFromCell(cell);
  } else {
    crawlAllLines();
  }

  return consecutives;
};
