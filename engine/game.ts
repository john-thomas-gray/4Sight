import { coordToKey, createEmptyBoard, createPieces, resolveSlotDrop } from "./board";
import { applyGravity } from "./gravity";
import { Coord, Direction, EngineResult, GameEvent, GameState, Team } from "./types";
import { detectWin } from "./winDetection";

export function createGame(): GameState {
  return {
    board: createEmptyBoard(),
    pieces: createPieces(),
    currentTeam: Team.One,
    turnCount: 0,
    winner: null,
    tie: false,
    status: "playing",
  };
}

/**
 * Places a piece on the board through a slot.
 * The piece slides inward from the slot until it lands.
 * After placement, checks for a win, then advances the turn.
 */
export function placePiece(
  state: GameState,
  slotCoord: Coord,
  pieceId: string,
): EngineResult {
  if (state.status === "finished") {
    return { state, events: [] };
  }

  const piece = state.pieces[pieceId];
  if (!piece) return { state, events: [] };
  if (piece.team !== state.currentTeam) return { state, events: [] };

  const landing = resolveSlotDrop(state.board, slotCoord);
  if (!landing) return { state, events: [] };

  const landingKey = coordToKey(landing);
  const newBoard = { ...state.board, [landingKey]: pieceId };
  const events: GameEvent[] = [
    { type: "piece_placed", pieceId, coord: landing },
  ];

  const winResult = detectWin(newBoard, state.pieces);

  if (winResult.tie) {
    const finishedState: GameState = {
      ...state,
      board: newBoard,
      turnCount: state.turnCount + 1,
      winner: null,
      tie: true,
      status: "finished",
    };
    events.push({ type: "game_tied", lines: winResult.lines });
    return { state: finishedState, events };
  }

  if (winResult.winner) {
    const finishedState: GameState = {
      ...state,
      board: newBoard,
      turnCount: state.turnCount + 1,
      winner: winResult.winner,
      tie: false,
      status: "finished",
    };
    events.push({ type: "game_won", team: winResult.winner, lines: winResult.lines });
    return { state: finishedState, events };
  }

  const nextTeam = state.currentTeam === Team.One ? Team.Two : Team.One;
  const advancedState: GameState = {
    ...state,
    board: newBoard,
    currentTeam: nextTeam,
    turnCount: state.turnCount + 1,
    tie: false,
  };
  events.push({ type: "turn_advanced", team: nextTeam });
  return { state: advancedState, events };
}

/**
 * Shifts gravity across the entire board.
 * All pieces slide in the given direction.
 * After the shift, checks for a win, then advances the turn.
 */
export function shiftGravity(
  state: GameState,
  direction: Direction,
): EngineResult {
  if (state.status === "finished") {
    return { state, events: [] };
  }

  const { board: newBoard, moves } = applyGravity(state.board, direction);

  if (moves.length === 0) {
    return { state, events: [{ type: "no_moves", direction }] };
  }

  const events: GameEvent[] = [
    { type: "gravity_shifted", direction, moves },
  ];

  const winResult = detectWin(newBoard, state.pieces);

  if (winResult.tie) {
    const finishedState: GameState = {
      ...state,
      board: newBoard,
      turnCount: state.turnCount + 1,
      winner: null,
      tie: true,
      status: "finished",
    };
    events.push({ type: "game_tied", lines: winResult.lines });
    return { state: finishedState, events };
  }

  if (winResult.winner) {
    const finishedState: GameState = {
      ...state,
      board: newBoard,
      turnCount: state.turnCount + 1,
      winner: winResult.winner,
      tie: false,
      status: "finished",
    };
    events.push({ type: "game_won", team: winResult.winner, lines: winResult.lines });
    return { state: finishedState, events };
  }

  const nextTeam = state.currentTeam === Team.One ? Team.Two : Team.One;
  const advancedState: GameState = {
    ...state,
    board: newBoard,
    currentTeam: nextTeam,
    turnCount: state.turnCount + 1,
    tie: false,
  };
  events.push({ type: "turn_advanced", team: nextTeam });
  return { state: advancedState, events };
}

export function resetGame(): GameState {
  return createGame();
}
