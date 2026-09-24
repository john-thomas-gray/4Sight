export { coordToKey, keyToCoord, isPlayable, isSlot, getSlotEntryDirection, resolveSlotDrop, getFirstOccupiedInSlotPath, findSlotForSpace, createPieces } from "./board";
export { applyGravity } from "./gravity";
export {
  detectWin,
  detectNearWins,
  winLineCascadeTiers,
  WINNER_CASCADE_STAGGER_MS,
  winningLinesForTeam,
  pieceStaggerDelaysForSyncedWinCascades,
  computeTieWinOverlayDelayMs,
  WINNER_MOTION_APEX_MS,
} from "./winDetection";
export { createGame, placePiece, shiftGravity, resetGame } from "./game";
export { legalMoves, applyMove } from "./moves";
export type { GameMove } from "./moves";
export { chooseComputerMove, chooseComputerMoveAsync } from "./computer";
export type { ComputerDecision, ComputerOptions } from "./computer";
export { Team, Direction, BOARD_SIZE, WIN_LENGTH, PIECES_PER_TEAM } from "./types";
export type { Coord, GameState, WinLine, EngineResult } from "./types";
export type { NearWin } from "./winDetection";
