import { Capturer, PieceProps } from "@/types/board";

interface xConsecutivesProps {
  boardPieces: BoardPieces;
  X: number;
  initialSpaceId?: string;
  allPieces: AllPieces;
}

type AllPieces = Record<string, PieceProps>;
type BoardPieces = Record<string, string>; // {"1-2" : "21"}
type ConsecutivesMap = Record<Capturer, Record<string, string>>; // [TeamTwo : {"1-1" : "2", "1-2" : "7", "1-3" : "3", "1-4" : "17"}]
type WinNextTurns = Record<Capturer, string[]>;

interface Consecutives {
  winners: ConsecutivesMap[];
  almosts: ConsecutivesMap[];
  winNextTurns: WinNextTurns;
  allPieces: AllPieces;
}

const xConsecutives = ({
  boardPieces,
  X,
  initialSpaceId,
  allPieces,
}: xConsecutivesProps) => {
  const consecutives: Consecutives = {
    winners: [],
    almosts: [],
    winNextTurns: {
      [Capturer.TeamOne]: [],
      [Capturer.TeamTwo]: [],
      [Capturer.Neutral]: [],
    },
  };

  const directions = [
    { name: "row", dx: 1, dy: 0 },
    { name: "column", dx: 0, dy: 1 },
    { name: "diagDown", dx: 1, dy: 1 },
    { name: "diagUp", dx: 1, dy: -1 },
  ];

  const SIZE = 7;

  const formatSpaceId = ({ x, y }: { x: number; y: number }) => `${x}-${y}`;

  function scanLine(line: string[][]) {
    let run: any[] = [];
    let lastCapturer: Capturer = Capturer.Neutral;

    const flushRun = () => {
      if (!run.length) return;

      const capturer = lastCapturer;

      const piecesObj = Object.fromEntries(
        run.map(([coord, piece]) => [coord, piece])
      );

      if (run.length >= X) {
        consecutives.winners.push({ [capturer]: piecesObj });
        console.log(consecutives.winners);
      } else if (run.length === X - 1) {
        // const ends = [
        //   line[line.indexOf(run[0]) - 1],
        //   line[line.indexOf(run.at(-1)) + 1],
        // ];
        // const emptyEnds =
        //   ends.filter(([coord]) => {
        //     const val = boardPieces[coord];
        //     return val === null;
        //   }) || [];
        // if (emptyEnds.length) {
        //   consecutives.almosts.push({ [capturer]: piecesObj });
        // }
        // if (emptyEnds.length) {
        //   consecutives.almosts.push({[capturer]: piecesMap});
        //   consecutives.winNextTurns.push(emptyEnds.map([coord]) => coord)
        // }
      }
      run = [];
    };

    for (const [spaceID, pieceID] of line) {
      if (!pieceID) {
        flushRun();
        lastCapturer = Capturer.Neutral;
        continue;
      }
      const piece = allPieces[pieceID];

      if (piece.team === lastCapturer) {
        run.push([spaceID, piece.id]);
      } else {
        flushRun();
        run = [[spaceID, piece.id]];
        lastCapturer = piece.team;
      }
    }
    flushRun();
  }

  function crawlAllLines() {
    // Rows
    for (let y = 1; y <= SIZE; y++) {
      const row = [];
      for (let x = 1; x <= SIZE; x++) {
        const spaceId = formatSpaceId({ x, y });

        const piece = boardPieces[spaceId];

        row.push([spaceId, piece]);
      }
      scanLine(row);
    }
  }
  crawlAllLines();
  return consecutives;
};

export default xConsecutives;
