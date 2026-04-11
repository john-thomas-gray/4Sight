import type { GameState } from "@/engine";
import type { PieceStatusMap } from "@/context/GameSessionContext";

export const CURRENT_SCHEMA_VERSION = 1;

/**
 * The serializable subset of game state that gets persisted.
 * Only domain data + minimal UI flags — no animation values,
 * no layout coordinates, no transient interaction state.
 */
export type PersistedGameState = {
  board: Record<string, string>;
  pieces: Record<string, { id: string; team: string }>;
  currentTeam: string;
  turnCount: number;
  winner: string | null;
  status: string;
};

export type PersistedSessionState = {
  game: PersistedGameState;
  pieceStatusMap: PieceStatusMap;
  wellPieceLocations: Record<string, string>;
};

export type PersistedSettings = {
  shiftPreviews: boolean;
  piecePlacementPreviews: boolean;
  highlightWinningMoves: boolean;
  themeId: string;
};

export type PersistedAppState = {
  schemaVersion: number;
  session: PersistedSessionState | null;
  settings: PersistedSettings;
};

export const DEFAULT_SETTINGS: PersistedSettings = {
  shiftPreviews: true,
  piecePlacementPreviews: true,
  highlightWinningMoves: true,
  themeId: "classic",
};

export function gameStateToSerializable(state: GameState): PersistedGameState {
  return {
    board: { ...state.board },
    pieces: Object.fromEntries(
      Object.entries(state.pieces).map(([id, p]) => [
        id,
        { id: p.id, team: p.team },
      ])
    ),
    currentTeam: state.currentTeam,
    turnCount: state.turnCount,
    winner: state.winner,
    status: state.status,
  };
}

export function serializableToGameState(
  persisted: PersistedGameState
): GameState {
  return {
    board: { ...persisted.board },
    pieces: Object.fromEntries(
      Object.entries(persisted.pieces).map(([id, p]) => [
        id,
        { id: p.id, team: p.team as GameState["currentTeam"] },
      ])
    ),
    currentTeam: persisted.currentTeam as GameState["currentTeam"],
    turnCount: persisted.turnCount,
    winner: (persisted.winner as GameState["winner"]) ?? null,
    status: persisted.status as GameState["status"],
  };
}
