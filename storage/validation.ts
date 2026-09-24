import { buildInitialWellPieceLocations } from "@/constants/wells";
import { detectWin, Team } from "@/engine";
import { PieceStatus, type PieceStatusMap } from "@/types/pieceStatus";
import type { PersistedSessionState, PersistedSettings } from "./schema";
import { DEFAULT_SETTINGS } from "./schema";
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function isTeam(value: unknown): value is Team {
  return value === Team.One || value === Team.Two;
}
export function validateSettings(raw: unknown): PersistedSettings {
  const settings = {
    ...DEFAULT_SETTINGS
  };
  if (!isRecord(raw)) return settings;
  for (const key of ["shiftPreviews", "piecePlacementPreviews", "highlightWinningMoves"] as const) {
    if (typeof raw[key] === "boolean") settings[key] = raw[key];
  }
  if (typeof raw.themeId === "string" && raw.themeId.length > 0) settings.themeId = raw.themeId;
  return settings;
}

/** Reject invalid domain data; rebuild transient presentation state from the board. */
export function validateSession(raw: unknown): PersistedSessionState | null {
  if (!isRecord(raw) || !isRecord(raw.game)) return null;
  if (raw.mode !== undefined && raw.mode !== "onePlayer" && raw.mode !== "twoPlayer") return null;
  const game = raw.game;
  if (!isTeam(game.currentTeam) || !Number.isSafeInteger(game.turnCount) || game.turnCount as number < 0) return null;
  if (game.status !== "playing" && game.status !== "finished") return null;
  if (game.winner !== null && !isTeam(game.winner)) return null;
  if (game.tie !== undefined && typeof game.tie !== "boolean") return null;
  if (game.status === "playing" && (game.winner !== null || game.tie === true)) return null;
  if (game.status === "finished" && (game.tie === true ? game.winner !== null : !isTeam(game.winner))) return null;
  if (!isRecord(game.board) || !isRecord(game.pieces)) return null;
  const pieces: Record<string, {
    id: string;
    team: Team;
  }> = {};
  for (const [id, piece] of Object.entries(game.pieces)) {
    if (!/^(?:[0-9]|[1-3][0-9]|4[0-7])$/.test(id) || !isRecord(piece) || piece.id !== id || !isTeam(piece.team)) return null;
    if (piece.team !== (Number(id) < 24 ? Team.One : Team.Two)) return null;
    pieces[id] = {
      id,
      team: piece.team
    };
  }
  const board: Record<string, string> = {};
  const used = new Set<string>();
  for (const [key, id] of Object.entries(game.board)) {
    if (!/^[1-7]-[1-7]$/.test(key) || typeof id !== "string" || !pieces[id] || used.has(id)) return null;
    used.add(id);
    board[key] = id;
  }
  const defaults = buildInitialWellPieceLocations();
  const wells: Record<string, string> = {};
  // Preserve valid rearrangements, but never restore held pieces or duplicate ownership.
  if (isRecord(raw.wellPieceLocations)) {
    for (const [wellId, id] of Object.entries(raw.wellPieceLocations)) {
      const defaultId = defaults[wellId];
      if (typeof id !== "string" || !pieces[id] || defaultId === undefined || used.has(id)) continue;
      if (Number(defaultId) < 24 !== (pieces[id].team === Team.One)) continue;
      wells[wellId] = id;
      used.add(id);
    }
  }
  for (const [id, piece] of Object.entries(pieces)) {
    if (used.has(id)) continue;
    const entry = Object.entries(defaults).find(([key, defaultId]) => wells[key] === undefined && Number(defaultId) < 24 === (piece.team === Team.One));
    if (entry) wells[entry[0]] = id;
  }
  const winners = game.status === "finished" ? new Set(detectWin(board, pieces).lines.flatMap(line => [...line.pieceIds])) : new Set<string>();
  const onBoard = new Set(Object.values(board));
  const pieceStatusMap: PieceStatusMap = {};
  for (const id of Object.keys(pieces)) {
    pieceStatusMap[id] = winners.has(id) ? PieceStatus.winner : onBoard.has(id) ? PieceStatus.onBoard : PieceStatus.inWell;
  }
  return {
    ...(raw.mode === undefined ? {} : { mode: raw.mode as "onePlayer" | "twoPlayer" }),
    game: {
      board,
      pieces,
      currentTeam: game.currentTeam,
      turnCount: game.turnCount as number,
      status: game.status,
      winner: game.winner,
      tie: game.tie === true
    },
    pieceStatusMap,
    wellPieceLocations: wells
  };
}
