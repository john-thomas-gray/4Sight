export const BOARD_SIZE = 7;
export const WIN_LENGTH = 4;
export const PIECES_PER_TEAM = 24;

export enum Team {
  One = "teamOne",
  Two = "teamTwo",
}

export enum Direction {
  Up = "up",
  Down = "down",
  Left = "left",
  Right = "right",
}

export type Coord = {
  readonly row: number;
  readonly col: number;
};

export type Piece = {
  readonly id: string;
  readonly team: Team;
};

export type GameStatus = "playing" | "finished";

export type GameState = {
  readonly board: Readonly<Record<string, string>>; // "row-col" -> pieceId
  readonly pieces: Readonly<Record<string, Piece>>; // pieceId -> Piece
  readonly currentTeam: Team;
  readonly turnCount: number;
  readonly winner: Team | null;
  /** Both teams completed a winning line on the same move (e.g. same gravity pull). */
  readonly tie: boolean;
  readonly status: GameStatus;
};

export type PieceMove = {
  readonly pieceId: string;
  readonly from: Coord;
  readonly to: Coord;
};

export type WinLine = {
  readonly pieceIds: readonly string[];
  readonly coords: readonly Coord[];
};

export type GameEvent =
  | { type: "piece_placed"; pieceId: string; coord: Coord }
  | { type: "gravity_shifted"; direction: Direction; moves: readonly PieceMove[] }
  | { type: "turn_advanced"; team: Team }
  | { type: "game_won"; team: Team; lines: readonly WinLine[] }
  | { type: "game_tied"; lines: readonly WinLine[] }
  | { type: "no_moves"; direction: Direction };

export type EngineResult = {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
};
