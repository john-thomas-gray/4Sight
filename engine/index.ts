export { coordToKey, keyToCoord, isPlayable, isSlot, getSlotEntryDirection, resolveSlotDrop, findSlotForSpace, createEmptyBoard, createPieces } from "./board";
export { applyGravity } from "./gravity";
export { detectWin, detectNearWins } from "./winDetection";
export { createGame, placePiece, shiftGravity, resetGame } from "./game";
export { Team, Direction, BOARD_SIZE, WIN_LENGTH, PIECES_PER_TEAM } from "./types";
export type { Coord, Piece, GameState, GameStatus, PieceMove, WinLine, GameEvent, EngineResult } from "./types";
export type { WinResult, NearWin } from "./winDetection";
