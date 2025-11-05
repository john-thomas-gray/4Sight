import { Team } from "@/types/board";
import { PieceProps } from "@/types/logic";
import getReachableSlot from "@/utils/getReachableSlot";

interface FindPieceRelationships {
  boardPieceLocations: Record<string, string>;
  winLen: number;
  allPieces: AllPieces;
}

type AllPieces = Record<string, PieceProps>;
export type BoardPiece = {
  spaceId: string;
  pieceId: string;
};
export type BoardPieces = BoardPiece[];
type Winners = Pick<Record<Team, BoardPieces[]>, Team.TeamOne | Team.TeamTwo>;
type Partials = Pick<Record<Team, BoardPieces[]>, Team.TeamOne | Team.TeamTwo>;
type WinNextTurns = Pick<Record<Team, string[]>, Team.TeamOne | Team.TeamTwo>;

interface PieceRelationships {
  winners: Winners;
  partials: Partials;
  winNextTurns: WinNextTurns;
}

const findPieceRelationships = ({
  boardPieceLocations,
  winLen,
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

  const SIZE = 7;

  const formatSpaceId = ({ x, y }: { x: number; y: number }) => `${x}-${y}`;

  // Track potential winning placements (empty cells that would complete a win)
  const winNextTurnSpaces: Record<Team.TeamOne | Team.TeamTwo, Set<string>> = {
    [Team.TeamOne]: new Set<string>(),
    [Team.TeamTwo]: new Set<string>(),
  };

  // Track all spaceIds that are part of any current winning sequence per team
  const winningSpaceIds: Record<Team.TeamOne | Team.TeamTwo, Set<string>> = {
    [Team.TeamOne]: new Set<string>(),
    [Team.TeamTwo]: new Set<string>(),
  };

  function scanLine(line: string[][]) {
    let run: any[] = [];
    let lastTeam: Team = Team.Unassigned;

    const items: { spaceId: string; pieceId: string; team: Team }[] = [];

    const flushRun = () => {
      if (!run.length) return;

      const team = lastTeam;

      if (run.length >= winLen) {
        if (team === Team.TeamOne || team === Team.TeamTwo) {
          pieceRelationships.winners[team].push(run);

          run.forEach(({ spaceId }) => winningSpaceIds[team].add(spaceId));
        }
      }
      run = [];
    };

    for (const [spaceId, pieceId] of line) {
      const piece = pieceId === "unassigned" ? null : allPieces[pieceId];
      const team: Team = piece?.team ?? Team.Unassigned;
      items.push({ spaceId, pieceId, team });

      if (piece && team === lastTeam) {
        run.push({ spaceId, pieceId: piece.id });
      } else {
        flushRun();
        run = [{ spaceId, pieceId: piece ? piece.id : "unassigned" }];
        lastTeam = team;
      }
    }
    flushRun();

    // Sliding window over the line to detect single-gap, same-team near-wins
    if (items.length >= winLen) {
      const reachabilityCache: Record<string, boolean> = {};
      const isReachable = (spaceId: string) => {
        if (reachabilityCache[spaceId] !== undefined)
          return reachabilityCache[spaceId];
        const layout: any = getReachableSlot(boardPieceLocations, spaceId);
        const drop = layout?.dropSlot;
        const ok =
          !!drop &&
          drop.id &&
          drop.id !== "null" &&
          drop.id !== "abort" &&
          drop.id !== "out of bounds" &&
          drop.distance !== 99;
        reachabilityCache[spaceId] = ok;
        return ok;
      };
      for (let i = 0; i <= items.length - winLen; i++) {
        const windowItems = items.slice(i, i + winLen);

        let teamOneCount = 0;
        let teamTwoCount = 0;
        const emptyCells: { spaceId: string }[] = [];
        const occupiedByTeamOne: string[] = [];
        const occupiedByTeamTwo: string[] = [];

        for (const it of windowItems) {
          if (it.team === Team.TeamOne) {
            teamOneCount++;
            occupiedByTeamOne.push(it.spaceId);
          } else if (it.team === Team.TeamTwo) {
            teamTwoCount++;
            occupiedByTeamTwo.push(it.spaceId);
          } else emptyCells.push({ spaceId: it.spaceId });
        }

        // Exactly one empty and the rest from the same team
        if (emptyCells.length === 1) {
          const emptyId = emptyCells[0].spaceId;
          if (teamOneCount === winLen - 1 && teamTwoCount === 0) {
            // Skip if any contributing spaces are part of an existing winning run
            const overlapsWinner = occupiedByTeamOne.some((sid) =>
              winningSpaceIds[Team.TeamOne].has(sid)
            );
            if (!overlapsWinner && isReachable(emptyId))
              winNextTurnSpaces[Team.TeamOne].add(emptyId);
          } else if (teamTwoCount === winLen - 1 && teamOneCount === 0) {
            const overlapsWinner = occupiedByTeamTwo.some((sid) =>
              winningSpaceIds[Team.TeamTwo].has(sid)
            );
            if (!overlapsWinner && isReachable(emptyId))
              winNextTurnSpaces[Team.TeamTwo].add(emptyId);
          }
        }
      }
    }
  }

  function crawlAllLines() {
    // Columns
    for (let x = 1; x <= SIZE; x++) {
      const col = [];
      for (let y = 1; y <= SIZE; y++) {
        const spaceId = formatSpaceId({ x, y });
        const pieceId = boardPieceLocations[spaceId] || "unassigned";
        col.push([spaceId, pieceId]);
      }
      scanLine(col);
    }

    // Rows
    for (let y = 1; y <= SIZE; y++) {
      const row = [];
      for (let x = 1; x <= SIZE; x++) {
        const spaceId = formatSpaceId({ x, y });
        const pieceId = boardPieceLocations[spaceId] || "unassigned";
        row.push([spaceId, pieceId]);
      }
      scanLine(row);
    }

    // Diagonals (down-right): start from top row and left column
    for (let startX = 1; startX <= SIZE; startX++) {
      let x = startX;
      let y = 1;
      const diag = [];
      while (x <= SIZE && y <= SIZE) {
        const spaceId = formatSpaceId({ x, y });
        const pieceId = boardPieceLocations[spaceId] || "unassigned";
        diag.push([spaceId, pieceId]);
        x++;
        y++;
      }
      scanLine(diag);
    }

    for (let startY = 2; startY <= SIZE; startY++) {
      let x = 1;
      let y = startY;
      const diag = [];
      while (x <= SIZE && y <= SIZE) {
        const spaceId = formatSpaceId({ x, y });
        const pieceId = boardPieceLocations[spaceId] || "unassigned";
        diag.push([spaceId, pieceId]);
        x++;
        y++;
      }
      scanLine(diag);
    }

    // Diagonals (up-right): start from top row and right column
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

    for (let startY = 2; startY <= SIZE; startY++) {
      let x = SIZE;
      let y = startY;
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
  pieceRelationships.winNextTurns[Team.TeamOne] = Array.from(
    winNextTurnSpaces[Team.TeamOne]
  );
  pieceRelationships.winNextTurns[Team.TeamTwo] = Array.from(
    winNextTurnSpaces[Team.TeamTwo]
  );
  return pieceRelationships;
};

export default findPieceRelationships;
