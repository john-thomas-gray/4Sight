import { scenarios } from "@/dev/scenarios";
import {
  createGame,
  placePiece,
  shiftGravity,
  resetGame,
  coordToKey,
  keyToCoord,
  isPlayable,
  isSlot,
  getSlotEntryDirection,
  resolveSlotDrop,
  applyGravity,
  detectWin,
  detectNearWins,
  winLineCascadeTiers,
  createPieces,
  Team,
  Direction,
  BOARD_SIZE,
  WIN_LENGTH,
  PIECES_PER_TEAM,
  GameState,
  Coord,
  WinLine,
  pieceStaggerDelaysForSyncedWinCascades,
  WINNER_CASCADE_STAGGER_MS,
} from "../index";

// ---------------------------------------------------------------------------
// Coordinate helpers
// ---------------------------------------------------------------------------
describe("coordToKey / keyToCoord", () => {
  it("round-trips correctly", () => {
    const coord: Coord = { row: 3, col: 5 };
    expect(keyToCoord(coordToKey(coord))).toEqual(coord);
  });

  it("formats as row-col", () => {
    expect(coordToKey({ row: 1, col: 7 })).toBe("1-7");
  });
});

describe("isPlayable", () => {
  it("accepts interior cells 1..7", () => {
    expect(isPlayable({ row: 1, col: 1 })).toBe(true);
    expect(isPlayable({ row: 4, col: 4 })).toBe(true);
    expect(isPlayable({ row: 7, col: 7 })).toBe(true);
  });

  it("rejects edge (slot/corner) cells", () => {
    expect(isPlayable({ row: 0, col: 3 })).toBe(false);
    expect(isPlayable({ row: 8, col: 3 })).toBe(false);
    expect(isPlayable({ row: 3, col: 0 })).toBe(false);
    expect(isPlayable({ row: 3, col: 8 })).toBe(false);
  });
});

describe("isSlot", () => {
  it("recognizes edge cells that are not corners", () => {
    expect(isSlot({ row: 0, col: 3 })).toBe(true);
    expect(isSlot({ row: 8, col: 5 })).toBe(true);
    expect(isSlot({ row: 4, col: 0 })).toBe(true);
    expect(isSlot({ row: 4, col: 8 })).toBe(true);
  });

  it("rejects corners", () => {
    expect(isSlot({ row: 0, col: 0 })).toBe(false);
    expect(isSlot({ row: 0, col: 8 })).toBe(false);
    expect(isSlot({ row: 8, col: 0 })).toBe(false);
    expect(isSlot({ row: 8, col: 8 })).toBe(false);
  });

  it("rejects interior cells", () => {
    expect(isSlot({ row: 4, col: 4 })).toBe(false);
  });
});

describe("getSlotEntryDirection", () => {
  it("top edge -> Down", () => {
    expect(getSlotEntryDirection({ row: 0, col: 3 })).toBe(Direction.Down);
  });
  it("bottom edge -> Up", () => {
    expect(getSlotEntryDirection({ row: 8, col: 3 })).toBe(Direction.Up);
  });
  it("left edge -> Right", () => {
    expect(getSlotEntryDirection({ row: 3, col: 0 })).toBe(Direction.Right);
  });
  it("right edge -> Left", () => {
    expect(getSlotEntryDirection({ row: 3, col: 8 })).toBe(Direction.Left);
  });
  it("non-slot -> null", () => {
    expect(getSlotEntryDirection({ row: 3, col: 3 })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Slot drop resolution
// ---------------------------------------------------------------------------
describe("resolveSlotDrop", () => {
  it("drops to far wall on empty board (top slot)", () => {
    const landing = resolveSlotDrop({}, { row: 0, col: 4 });
    expect(landing).toEqual({ row: 7, col: 4 });
  });

  it("drops to far wall on empty board (left slot)", () => {
    const landing = resolveSlotDrop({}, { row: 3, col: 0 });
    expect(landing).toEqual({ row: 3, col: 7 });
  });

  it("stacks above existing piece (top slot, piece at bottom)", () => {
    const board = { "7-4": "p1" };
    const landing = resolveSlotDrop(board, { row: 0, col: 4 });
    expect(landing).toEqual({ row: 6, col: 4 });
  });

  it("returns null when column is full", () => {
    const board: Record<string, string> = {};
    for (let r = 1; r <= 7; r++) board[`${r}-4`] = `p${r}`;
    const landing = resolveSlotDrop(board, { row: 0, col: 4 });
    expect(landing).toBeNull();
  });

  it("returns null for non-slot coord", () => {
    const landing = resolveSlotDrop({}, { row: 3, col: 3 });
    expect(landing).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Gravity
// ---------------------------------------------------------------------------
describe("applyGravity", () => {
  it("shifts a single piece down", () => {
    const board = { "2-4": "p1" };
    const result = applyGravity(board, Direction.Down);
    expect(result.board["7-4"]).toBe("p1");
    expect(result.board["2-4"]).toBeUndefined();
    expect(result.moves).toHaveLength(1);
    expect(result.moves[0]).toEqual({
      pieceId: "p1",
      from: { row: 2, col: 4 },
      to: { row: 7, col: 4 },
    });
  });

  it("shifts a single piece up", () => {
    const board = { "5-3": "p1" };
    const result = applyGravity(board, Direction.Up);
    expect(result.board["1-3"]).toBe("p1");
    expect(result.moves).toHaveLength(1);
  });

  it("shifts a single piece left", () => {
    const board = { "4-5": "p1" };
    const result = applyGravity(board, Direction.Left);
    expect(result.board["4-1"]).toBe("p1");
    expect(result.moves).toHaveLength(1);
  });

  it("shifts a single piece right", () => {
    const board = { "4-2": "p1" };
    const result = applyGravity(board, Direction.Right);
    expect(result.board["4-7"]).toBe("p1");
    expect(result.moves).toHaveLength(1);
  });

  it("stacks pieces correctly when shifting down", () => {
    const board = { "1-4": "p1", "3-4": "p2" };
    const result = applyGravity(board, Direction.Down);
    expect(result.board["7-4"]).toBe("p2");
    expect(result.board["6-4"]).toBe("p1");
  });

  it("reports no moves when already settled", () => {
    const board = { "7-4": "p1", "6-4": "p2" };
    const result = applyGravity(board, Direction.Down);
    expect(result.moves).toHaveLength(0);
    expect(result.board).toEqual(board);
  });
});

// ---------------------------------------------------------------------------
// Win detection
// ---------------------------------------------------------------------------
describe("detectWin", () => {
  const pieces = createPieces();

  it("detects a horizontal win", () => {
    const board: Record<string, string> = {};
    for (let c = 2; c <= 5; c++) board[`3-${c}`] = String(c - 2);
    const result = detectWin(board, pieces);
    expect(result.winner).toBe(Team.One);
    expect(result.lines.length).toBeGreaterThanOrEqual(1);
    expect(result.lines[0].pieceIds).toHaveLength(4);
  });

  it("detects a vertical win", () => {
    const board: Record<string, string> = {};
    for (let r = 2; r <= 5; r++) board[`${r}-3`] = String(r - 2);
    const result = detectWin(board, pieces);
    expect(result.winner).toBe(Team.One);
  });

  it("detects a diagonal win (down-right)", () => {
    const board: Record<string, string> = {};
    for (let i = 0; i < 4; i++) board[`${2 + i}-${2 + i}`] = String(i);
    const result = detectWin(board, pieces);
    expect(result.winner).toBe(Team.One);
  });

  it("detects a diagonal win (down-left)", () => {
    const board: Record<string, string> = {};
    for (let i = 0; i < 4; i++) board[`${2 + i}-${6 - i}`] = String(i);
    const result = detectWin(board, pieces);
    expect(result.winner).toBe(Team.One);
  });

  it("returns null winner when no win exists", () => {
    const board = { "1-1": "0", "1-3": "1", "1-5": "2" };
    const result = detectWin(board, pieces);
    expect(result.winner).toBeNull();
    expect(result.tie).toBe(false);
  });

  it("detects a Team Two win", () => {
    const board: Record<string, string> = {};
    for (let c = 1; c <= 4; c++) board[`5-${c}`] = String(PIECES_PER_TEAM + c - 1);
    const result = detectWin(board, pieces);
    expect(result.winner).toBe(Team.Two);
  });
});

describe("pieceStaggerDelaysForSyncedWinCascades", () => {
  const pieces = createPieces();
  const stagger = WINNER_CASCADE_STAGGER_MS;

  it("runs two line cascades on the same global tier clock", () => {
    const lineA: WinLine = { pieceIds: ["0", "1", "2", "3"], coords: [] };
    const lineB: WinLine = { pieceIds: ["10", "11", "12", "13"], coords: [] };
    const delays = pieceStaggerDelaysForSyncedWinCascades(
      [lineA, lineB],
      pieces,
      Team.One,
      ["2"],
    );
    expect(delays.get("2")).toBe(0);
    expect(delays.get("12")).toBe(0);
    expect(delays.get("1")).toBe(stagger);
    expect(delays.get("3")).toBe(stagger);
    expect(delays.get("11")).toBe(stagger);
    expect(delays.get("13")).toBe(stagger);
    expect(delays.get("0")).toBe(stagger * 2);
    expect(delays.get("10")).toBe(stagger * 2);
  });

  it("uses earliest tier when a piece belongs to two lines", () => {
    const lineA: WinLine = { pieceIds: ["0", "1", "2", "4"], coords: [] };
    const lineB: WinLine = { pieceIds: ["4", "5", "6", "7"], coords: [] };
    const delays = pieceStaggerDelaysForSyncedWinCascades(
      [lineA, lineB],
      pieces,
      Team.One,
      ["2"],
    );
    expect(delays.get("4")).toBe(stagger);
  });
});

describe("winLineCascadeTiers", () => {
  const line = ["a", "b", "c", "d"] as const;

  it("radiates from anchor with same-distance neighbors in one tier", () => {
    expect(winLineCascadeTiers(line, "c")).toEqual([
      ["c"],
      ["b", "d"],
      ["a"],
    ]);
  });

  it("uses line center when anchor is null", () => {
    expect(winLineCascadeTiers(line, null)).toEqual([
      ["c"],
      ["b", "d"],
      ["a"],
    ]);
  });

  it("radiates from an end when anchor is first", () => {
    expect(winLineCascadeTiers(line, "a")).toEqual([["a"], ["b"], ["c"], ["d"]]);
  });

  it("radiates from an end when anchor is last", () => {
    expect(winLineCascadeTiers(line, "d")).toEqual([["d"], ["c"], ["b"], ["a"]]);
  });
});

// ---------------------------------------------------------------------------
// Near-win detection
// ---------------------------------------------------------------------------
describe("detectNearWins", () => {
  const pieces = createPieces();

  it("finds a near-win when one cell is missing from a row", () => {
    const board: Record<string, string> = {
      "4-2": "0",
      "4-3": "1",
      "4-4": "2",
    };
    const nearWins = detectNearWins(board, pieces);
    const t1 = nearWins.filter((nw) => nw.team === Team.One);
    expect(t1.length).toBeGreaterThanOrEqual(1);
    const coords = t1.map((nw) => coordToKey(nw.emptyCoord));
    expect(coords.some((k) => k === "4-1" || k === "4-5")).toBe(true);
  });

  it("returns empty when no near-win exists", () => {
    const board = { "1-1": "0" };
    const nearWins = detectNearWins(board, pieces);
    expect(nearWins).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Game orchestration
// ---------------------------------------------------------------------------
describe("createGame", () => {
  it("returns a fresh game state", () => {
    const state = createGame();
    expect(state.status).toBe("playing");
    expect(state.winner).toBeNull();
    expect(state.currentTeam).toBe(Team.One);
    expect(state.turnCount).toBe(0);
    expect(Object.keys(state.board)).toHaveLength(0);
    expect(Object.keys(state.pieces)).toHaveLength(PIECES_PER_TEAM * 2);
  });
});

describe("placePiece", () => {
  it("places a piece through a top slot onto an empty board", () => {
    const state = createGame();
    const result = placePiece(state, { row: 0, col: 4 }, "0");
    expect(result.state.board["7-4"]).toBe("0");
    expect(result.state.currentTeam).toBe(Team.Two);
    expect(result.state.turnCount).toBe(1);
    expect(result.events.some((e) => e.type === "piece_placed")).toBe(true);
    expect(result.events.some((e) => e.type === "turn_advanced")).toBe(true);
  });

  it("rejects a move when it's not that piece's team's turn", () => {
    const state = createGame();
    const result = placePiece(state, { row: 0, col: 4 }, String(PIECES_PER_TEAM));
    expect(result.events).toHaveLength(0);
    expect(result.state).toBe(state);
  });

  it("rejects a move into a full column", () => {
    let state = createGame();
    const t1Pieces = ["0", "1", "2", "3"];
    const t2Pieces = [String(PIECES_PER_TEAM), String(PIECES_PER_TEAM + 1), String(PIECES_PER_TEAM + 2)];
    const allMoves = [t1Pieces[0], t2Pieces[0], t1Pieces[1], t2Pieces[1], t1Pieces[2], t2Pieces[2], t1Pieces[3]];

    for (const pid of allMoves) {
      const r = placePiece(state, { row: 0, col: 1 }, pid);
      state = r.state;
    }

    expect(Object.values(state.board).filter((v) => v !== undefined)).toHaveLength(7);
    const result = placePiece(state, { row: 0, col: 1 }, String(PIECES_PER_TEAM + 3));
    expect(result.events).toHaveLength(0);
  });

  it("detects a win after placement", () => {
    let state = createGame();
    const moves: Array<{ slot: Coord; pieceId: string }> = [
      { slot: { row: 0, col: 1 }, pieceId: "0" },
      { slot: { row: 0, col: 2 }, pieceId: String(PIECES_PER_TEAM) },
      { slot: { row: 0, col: 1 }, pieceId: "1" },
      { slot: { row: 0, col: 2 }, pieceId: String(PIECES_PER_TEAM + 1) },
      { slot: { row: 0, col: 1 }, pieceId: "2" },
      { slot: { row: 0, col: 2 }, pieceId: String(PIECES_PER_TEAM + 2) },
      { slot: { row: 0, col: 1 }, pieceId: "3" },
    ];

    let result;
    for (const m of moves) {
      result = placePiece(state, m.slot, m.pieceId);
      state = result.state;
    }

    expect(state.winner).toBe(Team.One);
    expect(state.status).toBe("finished");
    expect(result!.events.some((e) => e.type === "game_won")).toBe(true);
  });

  it("ignores moves after game is finished", () => {
    const finished: GameState = {
      ...createGame(),
      status: "finished",
      winner: Team.One,
      tie: false,
    };
    const result = placePiece(finished, { row: 0, col: 4 }, "10");
    expect(result.events).toHaveLength(0);
  });
});

describe("shiftGravity", () => {
  it("shifts pieces and advances the turn", () => {
    const state: GameState = {
      ...createGame(),
      board: { "2-4": "0" },
    };
    const result = shiftGravity(state, Direction.Down);
    expect(result.state.board["7-4"]).toBe("0");
    expect(result.state.board["2-4"]).toBeUndefined();
    expect(result.state.currentTeam).toBe(Team.Two);
    expect(result.events.some((e) => e.type === "gravity_shifted")).toBe(true);
  });

  it("emits no_moves when nothing can move", () => {
    const state: GameState = {
      ...createGame(),
      board: { "7-4": "0" },
    };
    const result = shiftGravity(state, Direction.Down);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].type).toBe("no_moves");
    expect(result.state.currentTeam).toBe(Team.One);
  });

  it("detects a win after gravity shift", () => {
    const board: Record<string, string> = {
      "3-1": "0",
      "5-2": "1",
      "2-3": "2",
      "4-4": "3",
    };
    const state: GameState = { ...createGame(), board };
    const result = shiftGravity(state, Direction.Down);
    expect(result.state.board["7-1"]).toBe("0");
    expect(result.state.board["7-2"]).toBe("1");
    expect(result.state.board["7-3"]).toBe("2");
    expect(result.state.board["7-4"]).toBe("3");
    expect(result.state.winner).toBe(Team.One);
    expect(result.state.tie).toBe(false);
    expect(result.state.status).toBe("finished");
  });

  it("tieGame scenario: simultaneous wins end in tie after gravity left", () => {
    const { board, currentTeam } = scenarios.tieGame;
    const state: GameState = {
      ...createGame(),
      board,
      currentTeam,
    };
    const result = shiftGravity(state, Direction.Left);
    expect(result.state.tie).toBe(true);
    expect(result.state.winner).toBeNull();
    expect(result.state.status).toBe("finished");
    expect(result.events.some((e) => e.type === "game_tied")).toBe(true);
  });
});

describe("resetGame", () => {
  it("returns a fresh state identical to createGame", () => {
    const fresh = createGame();
    const reset = resetGame();
    expect(reset).toEqual(fresh);
  });
});

// ---------------------------------------------------------------------------
// Constants sanity checks
// ---------------------------------------------------------------------------
describe("constants", () => {
  it("has expected values", () => {
    expect(BOARD_SIZE).toBe(7);
    expect(WIN_LENGTH).toBe(4);
    expect(PIECES_PER_TEAM).toBe(24);
  });
});
