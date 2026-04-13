import {
  createGame,
  placePiece,
  shiftGravity,
  applyGravity,
  detectWin,
  detectNearWins,
  createPieces,
  coordToKey,
  Team,
  Direction,
  BOARD_SIZE,
  WIN_LENGTH,
  PIECES_PER_TEAM,
} from "../index";
import type { GameState } from "../index";

// ---------------------------------------------------------------------------
// Gravity edge cases
// ---------------------------------------------------------------------------
describe("gravity edge cases", () => {
  it("handles a full row shifting (no movement)", () => {
    const board: Record<string, string> = {};
    for (let c = 1; c <= BOARD_SIZE; c++) board[`7-${c}`] = String(c - 1);
    const result = applyGravity(board, Direction.Down);
    expect(result.moves).toHaveLength(0);
  });

  it("handles a full column shifting (no movement)", () => {
    const board: Record<string, string> = {};
    for (let r = 1; r <= BOARD_SIZE; r++) board[`${r}-1`] = String(r - 1);
    const result = applyGravity(board, Direction.Left);
    expect(result.moves).toHaveLength(0);
  });

  it("preserves relative order when stacking left", () => {
    const board = { "3-3": "a", "3-5": "b", "3-7": "c" };
    const result = applyGravity(board, Direction.Left);
    expect(result.board["3-1"]).toBe("a");
    expect(result.board["3-2"]).toBe("b");
    expect(result.board["3-3"]).toBe("c");
  });

  it("preserves relative order when stacking right", () => {
    const board = { "3-1": "a", "3-3": "b", "3-5": "c" };
    const result = applyGravity(board, Direction.Right);
    expect(result.board["3-7"]).toBe("c");
    expect(result.board["3-6"]).toBe("b");
    expect(result.board["3-5"]).toBe("a");
  });

  it("handles a single piece in the center", () => {
    const board = { "4-4": "p1" };
    for (const dir of [Direction.Up, Direction.Down, Direction.Left, Direction.Right]) {
      const result = applyGravity(board, dir);
      expect(result.moves).toHaveLength(1);
    }
  });

  it("handles empty board", () => {
    const result = applyGravity({}, Direction.Down);
    expect(result.moves).toHaveLength(0);
    expect(result.board).toEqual({});
  });

  it("handles fully occupied board (no movement in any direction)", () => {
    const board: Record<string, string> = {};
    let id = 0;
    for (let r = 1; r <= BOARD_SIZE; r++) {
      for (let c = 1; c <= BOARD_SIZE; c++) {
        board[`${r}-${c}`] = String(id++);
      }
    }
    for (const dir of [Direction.Up, Direction.Down, Direction.Left, Direction.Right]) {
      const result = applyGravity(board, dir);
      expect(result.moves).toHaveLength(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Win detection edge cases
// ---------------------------------------------------------------------------
describe("win detection edge cases", () => {
  const pieces = createPieces();

  it("detects win of length > 4 (5 in a row)", () => {
    const board: Record<string, string> = {};
    for (let c = 1; c <= 5; c++) board[`3-${c}`] = String(c - 1);
    const result = detectWin(board, pieces);
    expect(result.winner).toBe(Team.One);
    expect(result.lines[0].pieceIds.length).toBeGreaterThanOrEqual(5);
  });

  it("detects win of length 7 (entire row)", () => {
    const board: Record<string, string> = {};
    for (let c = 1; c <= 7; c++) board[`1-${c}`] = String(c - 1);
    const result = detectWin(board, pieces);
    expect(result.winner).toBe(Team.One);
  });

  it("does not detect win with gap in middle", () => {
    const board: Record<string, string> = {
      "3-1": "0",
      "3-2": "1",
      "3-4": "2",
      "3-5": "3",
    };
    const result = detectWin(board, pieces);
    expect(result.winner).toBeNull();
  });

  it("does not detect win with mixed teams", () => {
    const board: Record<string, string> = {
      "3-1": "0",
      "3-2": "1",
      "3-3": String(PIECES_PER_TEAM),
      "3-4": "3",
    };
    const result = detectWin(board, pieces);
    expect(result.winner).toBeNull();
  });

  it("detects multiple simultaneous wins for same team", () => {
    const board: Record<string, string> = {};
    for (let c = 1; c <= 4; c++) board[`1-${c}`] = String(c - 1);
    for (let c = 1; c <= 4; c++) board[`3-${c}`] = String(c + 3);
    const result = detectWin(board, pieces);
    expect(result.winner).toBe(Team.One);
    expect(result.lines.length).toBeGreaterThanOrEqual(2);
  });

  it("detects both teams winning simultaneously after gravity", () => {
    const board: Record<string, string> = {};
    for (let c = 1; c <= 4; c++) board[`7-${c}`] = String(c - 1);
    for (let c = 4; c <= 7; c++) board[`6-${c}`] = String(PIECES_PER_TEAM + c - 4);
    const result = detectWin(board, pieces);
    expect(result.winner).not.toBeNull();
    expect(result.lines.length).toBeGreaterThanOrEqual(2);
  });

  it("detects corner diagonal win", () => {
    const board: Record<string, string> = {};
    for (let i = 0; i < 4; i++) board[`${1 + i}-${1 + i}`] = String(i);
    const result = detectWin(board, pieces);
    expect(result.winner).toBe(Team.One);
  });
});

// ---------------------------------------------------------------------------
// Near-win edge cases
// ---------------------------------------------------------------------------
describe("near-win edge cases", () => {
  const pieces = createPieces();

  it("does not report near-win when the empty cell is blocked", () => {
    const board: Record<string, string> = {
      "4-1": "0",
      "4-2": "1",
      "4-3": "2",
      "4-4": String(PIECES_PER_TEAM),
    };
    const nearWins = detectNearWins(board, pieces);
    const t1 = nearWins.filter((nw) => nw.team === Team.One);
    const keys = t1.map((nw) => coordToKey(nw.emptyCoord));
    expect(keys).not.toContain("4-4");
  });

  it("finds near-wins in multiple directions", () => {
    const board: Record<string, string> = {
      "4-2": "0",
      "4-3": "1",
      "4-4": "2",
      "2-5": "3",
      "3-5": "4",
      "4-5": "5",
    };
    const nearWins = detectNearWins(board, pieces);
    expect(nearWins.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Game flow edge cases
// ---------------------------------------------------------------------------
describe("game flow edge cases", () => {
  it("alternates turns correctly through multiple moves", () => {
    let state = createGame();
    const slots = [
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
      { row: 0, col: 4 },
    ];

    for (let i = 0; i < 4; i++) {
      const pieceId = i % 2 === 0 ? String(i / 2) : String(PIECES_PER_TEAM + Math.floor(i / 2));
      const expectedTeam = i % 2 === 0 ? Team.One : Team.Two;
      expect(state.currentTeam).toBe(expectedTeam);
      const result = placePiece(state, slots[i], pieceId);
      state = result.state;
    }
    expect(state.turnCount).toBe(4);
  });

  it("gravity shift after piece placement works correctly", () => {
    let state = createGame();
    const r1 = placePiece(state, { row: 0, col: 3 }, "0");
    state = r1.state;
    expect(state.board["7-3"]).toBe("0");

    const r2 = shiftGravity(state, Direction.Right);
    state = r2.state;
    expect(state.board["7-7"]).toBe("0");
    expect(state.board["7-3"]).toBeUndefined();
  });

  it("cannot place piece from wrong team", () => {
    const state = createGame();
    expect(state.currentTeam).toBe(Team.One);
    const result = placePiece(state, { row: 0, col: 1 }, String(PIECES_PER_TEAM));
    expect(result.events).toHaveLength(0);
  });

  it("gravity creating a win ends the game", () => {
    const board: Record<string, string> = {
      "4-1": "0",
      "4-3": "1",
      "4-5": "2",
      "4-7": "3",
    };
    const state: GameState = { ...createGame(), board };
    const result = shiftGravity(state, Direction.Left);
    expect(result.state.winner).toBe(Team.One);
    expect(result.state.status).toBe("finished");
  });

  it("no-op gravity does not change turn", () => {
    const board = { "1-1": "0" };
    const state: GameState = { ...createGame(), board };
    const result = shiftGravity(state, Direction.Up);
    expect(result.state.currentTeam).toBe(Team.One);
    expect(result.events[0].type).toBe("no_moves");
  });
});
