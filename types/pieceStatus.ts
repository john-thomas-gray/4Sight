/** Where a piece is in the interaction lifecycle (persisted with the session). */
export enum PieceStatus {
  inWell = "inWell",
  isHeld = "isHeld",
  onBoard = "onBoard",
  winner = "winner",
}

export type PieceStatusMap = Record<string, PieceStatus>;
