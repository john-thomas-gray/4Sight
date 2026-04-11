import { coordToKey, keyToCoord } from "./board";
import { BOARD_SIZE, Coord, Piece, Team, WIN_LENGTH, WinLine } from "./types";

export type WinResult = {
  winner: Team | null;
  lines: WinLine[];
};

export type NearWin = {
  team: Team;
  emptyCoord: Coord;
};

/**
 * Scans all rows, columns, and diagonals for winning sequences.
 * A win is WIN_LENGTH consecutive pieces of the same team.
 */
export function detectWin(
  board: Readonly<Record<string, string>>,
  pieces: Readonly<Record<string, Piece>>,
): WinResult {
  const lines: WinLine[] = [];
  let winner: Team | null = null;

  for (const line of allLines()) {
    const found = scanLineForWins(line, board, pieces);
    for (const winLine of found) {
      const team = pieces[winLine.pieceIds[0]].team;
      if (!winner) winner = team;
      lines.push(winLine);
    }
  }

  return { winner, lines };
}

/**
 * Finds "near-win" positions: empty cells where placing a piece
 * of the given team would complete a win. Only returns coords
 * that are reachable (adjacent to an occupied cell or board edge
 * in at least one slot-entry direction).
 */
export function detectNearWins(
  board: Readonly<Record<string, string>>,
  pieces: Readonly<Record<string, Piece>>,
): NearWin[] {
  const results: NearWin[] = [];
  const seen = new Set<string>();

  for (const line of allLines()) {
    const items = line.map((coord) => {
      const key = coordToKey(coord);
      const pieceId = board[key];
      const team = pieceId !== undefined ? pieces[pieceId]?.team ?? null : null;
      return { coord, key, pieceId: pieceId ?? null, team };
    });

    if (items.length < WIN_LENGTH) continue;

    for (let i = 0; i <= items.length - WIN_LENGTH; i++) {
      const window = items.slice(i, i + WIN_LENGTH);
      let oneCount = 0;
      let twoCount = 0;
      let emptyItem: (typeof items)[0] | null = null;

      for (const it of window) {
        if (it.team === Team.One) oneCount++;
        else if (it.team === Team.Two) twoCount++;
        else emptyItem = it;
      }

      if (emptyItem === null) continue;

      let nearTeam: Team | null = null;
      if (oneCount === WIN_LENGTH - 1 && twoCount === 0) nearTeam = Team.One;
      else if (twoCount === WIN_LENGTH - 1 && oneCount === 0) nearTeam = Team.Two;

      if (nearTeam && isReachableFromSlot(board, emptyItem.coord)) {
        const dedupKey = `${nearTeam}-${emptyItem.key}`;
        if (!seen.has(dedupKey)) {
          seen.add(dedupKey);
          results.push({ team: nearTeam, emptyCoord: emptyItem.coord });
        }
      }
    }
  }

  return results;
}

/**
 * Checks if a board coordinate can be reached by dropping a piece
 * from at least one slot (the piece would land at this coord after
 * sliding through empty cells).
 */
function isReachableFromSlot(
  board: Readonly<Record<string, string>>,
  target: Coord,
): boolean {
  const directions: Array<{ dRow: number; dCol: number }> = [
    { dRow: -1, dCol: 0 },
    { dRow: 1, dCol: 0 },
    { dRow: 0, dCol: -1 },
    { dRow: 0, dCol: 1 },
  ];

  for (const { dRow, dCol } of directions) {
    let r = target.row + dRow;
    let c = target.col + dCol;
    let pathClear = true;

    while (r >= 1 && r <= BOARD_SIZE && c >= 1 && c <= BOARD_SIZE) {
      if (board[`${r}-${c}`] !== undefined) {
        pathClear = false;
        break;
      }
      r += dRow;
      c += dCol;
    }

    if (pathClear) return true;
  }

  return false;
}

function scanLineForWins(
  line: Coord[],
  board: Readonly<Record<string, string>>,
  pieces: Readonly<Record<string, Piece>>,
): WinLine[] {
  const results: WinLine[] = [];
  let runTeam: Team | null = null;
  let runPieceIds: string[] = [];
  let runCoords: Coord[] = [];

  const flushRun = () => {
    if (runTeam && runPieceIds.length >= WIN_LENGTH) {
      results.push({ pieceIds: [...runPieceIds], coords: [...runCoords] });
    }
    runPieceIds = [];
    runCoords = [];
    runTeam = null;
  };

  for (const coord of line) {
    const key = coordToKey(coord);
    const pieceId = board[key];

    if (pieceId === undefined) {
      flushRun();
      continue;
    }

    const piece = pieces[pieceId];
    if (!piece) {
      flushRun();
      continue;
    }

    if (piece.team === runTeam) {
      runPieceIds.push(pieceId);
      runCoords.push(coord);
    } else {
      flushRun();
      runTeam = piece.team;
      runPieceIds = [pieceId];
      runCoords = [coord];
    }
  }
  flushRun();

  return results;
}

function* allLines(): Generator<Coord[]> {
  for (let row = 1; row <= BOARD_SIZE; row++) {
    const line: Coord[] = [];
    for (let col = 1; col <= BOARD_SIZE; col++) line.push({ row, col });
    yield line;
  }

  for (let col = 1; col <= BOARD_SIZE; col++) {
    const line: Coord[] = [];
    for (let row = 1; row <= BOARD_SIZE; row++) line.push({ row, col });
    yield line;
  }

  // Down-right diagonals
  for (let startCol = 1; startCol <= BOARD_SIZE; startCol++) {
    const line: Coord[] = [];
    let r = 1, c = startCol;
    while (r <= BOARD_SIZE && c <= BOARD_SIZE) {
      line.push({ row: r, col: c });
      r++; c++;
    }
    if (line.length >= WIN_LENGTH) yield line;
  }
  for (let startRow = 2; startRow <= BOARD_SIZE; startRow++) {
    const line: Coord[] = [];
    let r = startRow, c = 1;
    while (r <= BOARD_SIZE && c <= BOARD_SIZE) {
      line.push({ row: r, col: c });
      r++; c++;
    }
    if (line.length >= WIN_LENGTH) yield line;
  }

  // Down-left diagonals (anti-diagonals)
  for (let startCol = BOARD_SIZE; startCol >= 1; startCol--) {
    const line: Coord[] = [];
    let r = 1, c = startCol;
    while (r <= BOARD_SIZE && c >= 1) {
      line.push({ row: r, col: c });
      r++; c--;
    }
    if (line.length >= WIN_LENGTH) yield line;
  }
  for (let startRow = 2; startRow <= BOARD_SIZE; startRow++) {
    const line: Coord[] = [];
    let r = startRow, c = BOARD_SIZE;
    while (r <= BOARD_SIZE && c >= 1) {
      line.push({ row: r, col: c });
      r++; c--;
    }
    if (line.length >= WIN_LENGTH) yield line;
  }
}
