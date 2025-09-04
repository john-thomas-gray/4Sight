import { PieceProps, Team } from "@/types/board";

interface FindPieceRelationships {
  boardPieceLocations: Record<string, string>;
  winLen: number;
  initialSpaceId?: string;
  allPieces: AllPieces;
}

type AllPieces = Record<string, PieceProps>;
type BoardPiece = {
  spaceId: string;
  pieceId: string;
};
type Consecutives = BoardPiece[];
type Winners = Pick<Record<Team, Consecutives[]>, Team.TeamOne | Team.TeamTwo>;
type Partials = Pick<Record<Team, Consecutives[]>, Team.TeamOne | Team.TeamTwo>;
type WinNextTurns = Pick<Record<Team, string[]>, Team.TeamOne | Team.TeamTwo>;

interface PieceRelationships {
  winners: Winners;
  partials: Partials;
  winNextTurns: WinNextTurns;
}

const findPieceRelationships = ({
  boardPieceLocations,
  winLen,
  initialSpaceId,
  allPieces,
}: FindPieceRelationships) => {
  const pieceRelationships: PieceRelationships = {
    winners: {
      [Team.TeamOne]: [],
      [Team.TeamTwo]: [],
    },
    partials: {
      [Team.TeamOne]: [],
      [Team.TeamTwo]: [],
    },
    winNextTurns: {
      [Team.TeamOne]: [],
      [Team.TeamTwo]: [],
    },
  };

  // const directions = [
  //   { name: "row", dx: 1, dy: 0 },
  //   { name: "column", dx: 0, dy: 1 },
  //   { name: "diagDown", dx: -1, dy: 1 },
  //   { name: "diagUp", dx: -1, dy: 1 },
  // ];

  const SIZE = 7;

  const formatSpaceId = ({ x, y }: { x: number; y: number }) => `${x}-${y}`;

  function scanLine(line: string[][]) {
    let run: any[] = [];
    let lastTeam: Team = Team.Unassigned;

    const flushRun = () => {
      if (!run.length) return;

      const team = lastTeam;

      if (run.length >= winLen) {
        if (team === Team.TeamOne || team === Team.TeamTwo) {
          pieceRelationships.winners[team].push(run);
        }
      } else if (run.length === winLen - 1) {
      }
      run = [];
    };

    for (const [spaceId, pieceId] of line) {
      if (pieceId === "unassigned") {
        flushRun();
        lastTeam = Team.Unassigned;
        continue;
      }
      const piece = allPieces[pieceId];
      console.log(pieceId);

      if (piece.team === lastTeam) {
        run.push({ spaceId, pieceId: piece.id });
      } else {
        flushRun();
        run = [{ spaceId, pieceId: piece.id }];
        lastTeam = piece.team;
      }
    }
    flushRun();
  }

  function crawlAllLines() {
    // Columns
    for (let y = 1; y <= SIZE; y++) {
      const col = [];
      for (let x = 1; x <= SIZE; x++) {
        const spaceId = formatSpaceId({ x, y });
        const pieceId = boardPieceLocations[spaceId] || "unassigned";
        col.push([spaceId, pieceId]);
      }
      scanLine(col);
    }

    // Rows
    for (let x = 1; x <= SIZE; x++) {
      const row = [];
      for (let y = 1; y <= SIZE; y++) {
        const spaceId = formatSpaceId({ x, y });
        const pieceId = boardPieceLocations[spaceId] || "unassigned";
        row.push([spaceId, pieceId]);
      }
      scanLine(row);
    }

    // Diagonals (down-right)
    for (let startY = 1; startY <= SIZE; startY++) {
      let x = 1;
      let y = startY;
      const diag = [];
      while (x <= SIZE && y >= 1) {
        const spaceId = formatSpaceId({ x, y });
        const pieceId = boardPieceLocations[spaceId] || "unassigned";
        diag.push([spaceId, pieceId]);
        x++;
        y++;
      }
      scanLine(diag);
    }
    // Diagonals (up-right)
    for (let startX = SIZE; startX >= 1; startX--) {
      let x = startX;
      let y = 1;
      const diag = [];
      while (x >= 1 && y <= SIZE) {
        const spaceId = formatSpaceId({ x, y });
        const pieceId = boardPieceLocations[spaceId] || "unassigned";
        diag.push([spaceId, pieceId]);
        x--;
        y++;
      }
      scanLine(diag);
    }
  }

  crawlAllLines();
  return pieceRelationships;
};

export default findPieceRelationships;

// consecutives:
//    { winners: {
//     Team.TeamOne:
//       [{spaceId: "1-1", pieceId: "1"}, {pieceId: "1-2", spaceId: "2"}, {pieceId: "1-3", spaceId: "3"} ],
//       [{spaceId: "3-1", pieceId: "8"], [pieceId: "3-2", spaceId: "9"}, [pieceId: "3-3", spaceId: "10}] ],

//     ]
//    },
//     partials: {
//       [Team.TeamOne]: [{spaceId: "6-1", pieceId: "8"], [pieceId: "7-1", spaceId: "9"} ],
//       [Team.TeamTwo]: [],
//       [Team.Unassigned]: [],
//     }
//   }
//     winNextTurns:
//       [Team.TeamOne]: ["5-3", "2-4"],
//       [Team.TeamTwo]: [],
//       [Team.Unassigned]: [],
//     }

// else if...
// const ends = [
//   line[line.indexOf(run[0]) - 1],
//   line[line.indexOf(run.at(-1)) + 1],
// ];
// const emptyEnds =
//   ends.filter(([coord]) => {
//     const val = boardPieceLocations[coord];
//     return val === null;
//   }) || [];
// if (emptyEnds.length) {
//   consecutives.partials.push({ [capturer]: piecesObj });
// }
// if (emptyEnds.length) {
//   consecutives.partials.push({[capturer]: piecesMap});
//   consecutives.winNextTurns.push(emptyEnds.map([coord]) => coord)
// }

// REMAINING FUNCTIONALITY

// Additionally, if a space preceeds or follows (X - 1) consecutive
// spaces containing pieces of the same team, unless those pieceIds
// are part of a sequence of X or more, push a map of that sequence
// to almosts (team as the key, and a map of spaceids as keys and
// thier corresponding pieceIds as values). Push the empty spaces
// to the almostEmpties array.

// if cell is input, run the cell variation:

// starting at the input cell,
// check each direction (diagonally, horizontally and vertically)
// for sequences of x or more consecutive spaces containing pieces of the same team.
// check for sequences of (X - 1) preceeded or followed by an empty space.
// (omit a check if it would extend out of bounds)
// continue if a sequence of (X - 1) consecutive pieces becomes impossible

// OPTIMIZATIONS

// On diagonal crawls start only at spaces which could lead to an X
// long consecutive. eg if X = 4, start at space "4-1""

// >>>>>(starting at spaces "4-1" and "4-7")<<<<<

// If, in the course of crawling a line,
// a sequence of X consecutive pieces becomes impossible, continue
