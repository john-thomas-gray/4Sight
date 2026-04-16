import {
  TIE_WIN_SECOND_CASCADE_BEAT_MS,
  WIN_OVERLAY_DELAY_MS,
} from "@/constants/logic";
import { WINNER_V0, WINNER_V1 } from "@/types/animation";
import { coordToKey } from "./board";
import { BOARD_SIZE, Coord, Piece, Team, WIN_LENGTH, WinLine } from "./types";

export type WinResult = {
  winner: Team | null;
  /** Both teams have at least one winning line on this board. */
  tie: boolean;
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

  for (const line of allLines()) {
    const found = scanLineForWins(line, board, pieces);
    for (const winLine of found) {
      lines.push(winLine);
    }
  }

  const teamsWithWin = new Set<Team>();
  for (const winLine of lines) {
    const firstId = winLine.pieceIds[0];
    const p = firstId !== undefined ? pieces[firstId] : undefined;
    if (p) teamsWithWin.add(p.team);
  }
  const tie = teamsWithWin.size > 1;
  const winner =
    lines.length === 0
      ? null
      : tie
        ? null
        : (() => {
            const firstId = lines[0].pieceIds[0];
            return firstId !== undefined
              ? (pieces[firstId]?.team ?? null)
              : null;
          })();

  return { winner, tie, lines };
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
      const team =
        pieceId !== undefined ? (pieces[pieceId]?.team ?? null) : null;
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
      else if (twoCount === WIN_LENGTH - 1 && oneCount === 0)
        nearTeam = Team.Two;

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

/**
 * Groups winning piece ids into animation tiers: anchor first, then pairs
 * outward along the line (lower index before higher). Same-distance neighbors
 * share a tier so their animations start together.
 *
 * @param anchorPieceId — piece that completed the win (e.g. last drop); if null or not on the line, uses the line center index.
 */
export function winLineCascadeTiers(
  pieceIds: readonly string[],
  anchorPieceId: string | null,
): string[][] {
  const ids = [...pieceIds];
  if (ids.length === 0) return [];

  let idx = anchorPieceId !== null ? ids.indexOf(anchorPieceId) : -1;
  if (idx < 0) idx = Math.floor(ids.length / 2);

  const tiers: string[][] = [];
  for (let d = 0; d < ids.length; d++) {
    const tier: string[] = [];
    if (d === 0) {
      tier.push(ids[idx]);
    } else {
      const left = idx - d;
      const right = idx + d;
      if (left >= 0) tier.push(ids[left]);
      if (right < ids.length) tier.push(ids[right]);
    }
    if (tier.length === 0) break;
    tiers.push(tier);
  }
  return tiers;
}

/** Stagger between cascade tiers (shared global clock across simultaneous line cascades). */
export const WINNER_CASCADE_STAGGER_MS = 140;

export function winningLinesForTeam(
  lines: readonly WinLine[],
  pieces: Readonly<Record<string, Piece>>,
  team: Team,
): WinLine[] {
  return lines.filter(
    (line) =>
      line.pieceIds.length > 0 && pieces[line.pieceIds[0]]?.team === team,
  );
}

/**
 * Each winning line gets its own radiating cascade from that line’s anchor
 * (preferred id on the line, else line center). All lines share the same
 * global tier clock: tier 0 at 0 ms, tier 1 at `staggerMs`, … so cascades
 * start together but pieces do not all fire at once.
 *
 * If a piece sits on several winning lines, it animates once at the minimum
 * tier delay among those lines.
 */
export function pieceStaggerDelaysForSyncedWinCascades(
  lines: readonly WinLine[],
  pieces: Readonly<Record<string, Piece>>,
  winnerTeam: Team,
  preferredAnchorPieceIds: readonly string[],
  staggerMs: number = WINNER_CASCADE_STAGGER_MS,
): Map<string, number> {
  const anchors = new Set(preferredAnchorPieceIds.filter(Boolean));
  const winningLines = winningLinesForTeam(lines, pieces, winnerTeam);
  const delays = new Map<string, number>();

  for (const line of winningLines) {
    const anchor = line.pieceIds.find((pid) => anchors.has(pid)) ?? null;
    const tiers = winLineCascadeTiers(line.pieceIds, anchor);
    tiers.forEach((tier, tierIndex) => {
      const t = tierIndex * staggerMs;
      for (const pid of tier) {
        const prev = delays.get(pid);
        if (prev === undefined || t < prev) delays.set(pid, t);
      }
    });
  }
  return delays;
}

/** Time from motion start to the peak of the first winner-motion phase (aligns with color sweep end). */
export const WINNER_MOTION_APEX_MS = WINNER_V1;

export function computeTieWinOverlayDelayMs(
  board: Readonly<Record<string, string>>,
  pieces: Readonly<Record<string, Piece>>,
  pullerTeam: Team,
  preferredAnchorPieceIds: readonly string[],
): number | null {
  const winResult = detectWin(board, pieces);
  if (!winResult.tie) return null;

  const delaysPuller = pieceStaggerDelaysForSyncedWinCascades(
    winResult.lines,
    pieces,
    pullerTeam,
    preferredAnchorPieceIds,
  );

  let maxPullerStart = 0;
  for (const d of delaysPuller.values()) {
    maxPullerStart = Math.max(maxPullerStart, d);
  }
  const entryMs = WINNER_V1 + WINNER_V0;
  const otherPhaseStart =
    maxPullerStart + entryMs + TIE_WIN_SECOND_CASCADE_BEAT_MS;

  return otherPhaseStart + WIN_OVERLAY_DELAY_MS;
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
    let r = 1,
      c = startCol;
    while (r <= BOARD_SIZE && c <= BOARD_SIZE) {
      line.push({ row: r, col: c });
      r++;
      c++;
    }
    if (line.length >= WIN_LENGTH) yield line;
  }
  for (let startRow = 2; startRow <= BOARD_SIZE; startRow++) {
    const line: Coord[] = [];
    let r = startRow,
      c = 1;
    while (r <= BOARD_SIZE && c <= BOARD_SIZE) {
      line.push({ row: r, col: c });
      r++;
      c++;
    }
    if (line.length >= WIN_LENGTH) yield line;
  }

  // Down-left diagonals (anti-diagonals)
  for (let startCol = BOARD_SIZE; startCol >= 1; startCol--) {
    const line: Coord[] = [];
    let r = 1,
      c = startCol;
    while (r <= BOARD_SIZE && c >= 1) {
      line.push({ row: r, col: c });
      r++;
      c--;
    }
    if (line.length >= WIN_LENGTH) yield line;
  }
  for (let startRow = 2; startRow <= BOARD_SIZE; startRow++) {
    const line: Coord[] = [];
    let r = startRow,
      c = BOARD_SIZE;
    while (r <= BOARD_SIZE && c >= 1) {
      line.push({ row: r, col: c });
      r++;
      c--;
    }
    if (line.length >= WIN_LENGTH) yield line;
  }
}
