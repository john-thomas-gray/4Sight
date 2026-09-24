import { createGame, placePiece, shiftGravity } from "../game";
import { chooseComputerMove, chooseComputerMoveAsync, positionKey } from "../computer";
import { applyMove, legalMoves } from "../moves";
import { coordToKey, resolveSlotDrop } from "../board";
import { detectNearWins } from "../winDetection";
import { Direction, GameState, Team } from "../types";
import { scenarios } from "@/dev/scenarios";

const tactical = { timeLimitMs: 0 };
const opponent = (team: Team) => team === Team.One ? Team.Two : Team.One;
const stateWith = (board: Record<string, string>, currentTeam = Team.One): GameState => ({ ...createGame(), board, currentTeam });
const winningMoves = (state: GameState, team = state.currentTeam) => {
  const turn = { ...state, currentTeam: team };
  return legalMoves(turn).filter(move => applyMove(turn, move).winner === team);
};
const safeMoves = (state: GameState) => legalMoves(state).filter(move => {
  const next = applyMove(state, move);
  return next.winner !== opponent(state.currentTeam) && !winningMoves(next, opponent(state.currentTeam)).length;
});
const forcesWinNextTurn = (stateAfterMove: GameState, team: Team) => {
  if (stateAfterMove.status === "finished") return stateAfterMove.winner === team;
  const replies = legalMoves(stateAfterMove);
  return replies.length > 0 && replies.every(reply => {
    const next = applyMove(stateAfterMove, reply);
    return next.winner === team || (next.status === "playing" && winningMoves(next, team).length > 0);
  });
};

describe("legal move generation", () => {
  it("deduplicates landing squares, excludes ineffective pulls, and spends one available piece", () => {
    const state = createGame();
    const moves = legalMoves(state);
    expect(moves).toHaveLength(24); // Four corners each have two equivalent entries.
    const landings = moves.map(move => move.type === "place" ? coordToKey(resolveSlotDrop(state.board, move.slot)!) : "pull");
    expect(new Set(landings).size).toBe(moves.length);
    for (const move of moves) expect(applyMove(state, move).turnCount).toBe(1);
    const next = placePiece(state, { row: 0, col: 1 }, "0").state;
    expect(legalMoves(next).filter(move => move.type === "pull")).toHaveLength(2);
  });

  it("never reuses a piece already on the board or invents a reserve piece", () => {
    const state = stateWith({ "7-1": "0" });
    for (const move of legalMoves(state)) if (move.type === "place") expect(move.pieceId).toBe("1");
    expect(legalMoves({ ...state, pieces: { "0": state.pieces["0"] } }).every(move => move.type === "pull")).toBe(true);
  });
});

describe("computer tactics", () => {
  it("wins by placement before considering defense", () => {
    const state = stateWith({ "7-1": "0", "7-2": "1", "7-3": "2", "1-1": "24", "1-2": "25", "1-3": "26" });
    const choice = chooseComputerMove(state, tactical);
    expect(choice.reason).toBe("win");
    expect(applyMove(state, choice.move!).winner).toBe(Team.One);
  });

  it("takes a winning pull even when there is no winning placement", () => {
    const state = stateWith({ "1-1": "0", "3-2": "1", "5-3": "2", "6-4": "3" });
    expect(winningMoves(state).every(move => move.type === "pull")).toBe(true);
    const choice = chooseComputerMove(state, tactical);
    expect(choice.move?.type).toBe("pull");
    expect(applyMove(state, choice.move!).winner).toBe(Team.One);
  });

  it("blocks every immediate reply, including gravity wins", () => {
    const state = stateWith({ "7-1": "24", "7-2": "25", "7-3": "26" });
    const choice = chooseComputerMove(state, tactical);
    expect(choice.reason).toBe("defend");
    const next = applyMove(state, choice.move!);
    expect(next.board["7-4"]).toBe("0");
    expect(winningMoves(next)).toHaveLength(0);
  });

  it("keeps an immediate safe move even when the deeper node budget expires", () => {
    const state = stateWith({ "7-1": "24", "7-2": "25", "7-3": "26" });
    const choice = chooseComputerMove(state, { maxDepth: 4, maxNodes: 1, timeLimitMs: Infinity });
    expect(safeMoves(state)).toContainEqual(choice.move);
    expect(choice.completedDepth).toBe(2);
  });

  it("does not pull just for positional improvement", () => {
    const state = stateWith({ "7-3": "0", "7-5": "24" });
    expect(legalMoves(state).some(move => move.type === "pull")).toBe(true);
    expect(chooseComputerMove(state, tactical).move?.type).toBe("place");
  });

  it("uses a defensive pull when no placement answers all threats", () => {
    const state = stateWith({ "1-6": "0", "7-7": "24", "7-4": "1", "6-4": "25", "7-3": "2", "3-1": "26", "7-2": "3", "2-6": "27", "3-6": "4" }, Team.Two);
    expect(safeMoves(state).every(move => move.type === "pull")).toBe(true);
    const decision = chooseComputerMove(state, tactical);
    expect(decision.move?.type).toBe("pull");
    expect(safeMoves(state)).toContainEqual(decision.move);
  });

  it("finds a forced next-turn win after examining every opponent reply", () => {
    const state = stateWith({ "7-5": "0", "1-4": "24", "1-5": "1", "4-1": "25", "7-6": "2", "6-1": "26", "1-6": "3" }, Team.Two);
    const decision = chooseComputerMove(state, { maxDepth: 3, timeLimitMs: Infinity });
    expect(decision.reason).toBe("fork");
    expect(forcesWinNextTurn(applyMove(state, decision.move!), Team.Two)).toBe(true);
  });

  it("does not mistake two winning squares that a pull can erase for a forced win", () => {
    const state = stateWith({ "7-3": "0", "7-4": "24", "6-3": "1", "1-2": "25", "7-2": "2", "5-3": "26", "2-7": "3", "6-4": "27", "3-7": "4", "2-6": "28" });
    const tempting = placePiece(state, { row: 4, col: 0 }, "5").state;
    expect(winningMoves(tempting, Team.One).filter(move => move.type === "place").length).toBeGreaterThanOrEqual(2);
    expect(forcesWinNextTurn(tempting, Team.One)).toBe(false);
    const decision = chooseComputerMove(state, { maxDepth: 3, timeLimitMs: Infinity });
    expect(decision.reason === "fork").toBe(forcesWinNextTurn(applyMove(state, decision.move!), Team.One));
  });

  it("completes four plies on the opening board within a bounded node budget", () => {
    const decision = chooseComputerMove(createGame(), { maxDepth: 4, timeLimitMs: Infinity, maxNodes: 20_000 });
    expect(decision.completedDepth).toBe(4);
    expect(decision.nodes).toBeLessThan(20_000);
    expect(decision.move?.type).toBe("place");
  });

  it("allows an attacking pull only when placements cannot create multiple winning squares", () => {
    const state = stateWith({ "1-1": "24", "1-2": "25", "1-3": "0", "1-4": "26", "1-5": "27", "1-6": "1", "1-7": "2", "2-4": "28", "2-5": "3", "2-6": "4", "2-7": "5", "7-6": "6", "7-7": "7" });
    expect(winningMoves(state, Team.Two)).toHaveLength(0);
    const placements = safeMoves(state).filter(move => move.type === "place");
    expect(placements.every(move => winningMoves(applyMove(state, move), Team.One).filter(m => m.type === "place").length < 2)).toBe(true);
    const decision = chooseComputerMove(state, tactical);
    expect(decision.move?.type).toBe("pull");
    expect(winningMoves(applyMove(state, decision.move!), Team.One).filter(move => move.type === "place").length).toBeGreaterThanOrEqual(2);
  });

  it("prefers placement when both placement and pulling can make multiple winning squares", () => {
    const state = stateWith({ "4-5": "0", "4-6": "24", "4-7": "1", "5-3": "25", "5-6": "2", "5-7": "3", "6-1": "26", "6-3": "4", "6-4": "5", "6-6": "27", "6-7": "28", "7-1": "6", "7-3": "7", "7-4": "29", "7-5": "30", "7-6": "8", "7-7": "9" });
    expect(winningMoves(state, Team.Two)).toHaveLength(0);
    const forks = safeMoves(state).filter(move => winningMoves(applyMove(state, move), Team.One).filter(m => m.type === "place").length >= 2);
    expect(forks.some(move => move.type === "place")).toBe(true);
    expect(forks.some(move => move.type === "pull")).toBe(true);
    expect(chooseComputerMove(state, { maxDepth: 4, timeLimitMs: Infinity }).move?.type).toBe("place");
  });

  it("avoids letting the opponent create a forced win on their following turn", () => {
    const state = stateWith({ "1-1": "24", "1-2": "25", "1-4": "0", "1-6": "1", "1-7": "26", "2-1": "2", "2-2": "3", "2-6": "27", "2-7": "4", "3-1": "5", "3-6": "6", "3-7": "28" }, Team.Two);
    const permitsFork = (after: GameState) => legalMoves(after).some(reply => forcesWinNextTurn(applyMove(after, reply), Team.One));
    const trap = placePiece(state, { row: 8, col: 5 }, "29").state;
    expect(winningMoves(trap)).toHaveLength(0);
    expect(permitsFork(trap)).toBe(true);
    const decision = chooseComputerMove(state, { maxDepth: 4, timeLimitMs: Infinity });
    expect(permitsFork(applyMove(state, decision.move!))).toBe(false);
  });

  it("distinguishes a simultaneous win from an exclusive win", () => {
    const state = stateWith(scenarios.tieGame.board);
    const tied = shiftGravity(state, Direction.Left).state;
    expect(tied.tie).toBe(true);
    expect(tied.winner).toBeNull();
    const choice = chooseComputerMove(state, tactical);
    expect(choice.reason === "win").toBe(applyMove(state, choice.move!).winner === Team.One);
  });

  it("does not mutate the supplied game and makes deterministic choices", () => {
    const state = stateWith({ "7-3": "0", "7-5": "24" });
    const original = JSON.stringify(state);
    const first = chooseComputerMove(state, tactical);
    expect(chooseComputerMove(state, tactical).move).toEqual(first.move);
    expect(JSON.stringify(state)).toBe(original);
  });

  it("handles completed games and positions without legal actions", () => {
    expect(chooseComputerMove({ ...createGame(), status: "finished", winner: Team.One }).move).toBeNull();
    expect(chooseComputerMove({ ...createGame(), pieces: {} }).move).toBeNull();
  });

  it("keys equivalent colored positions together, but separates turns and reserves", () => {
    const a = stateWith({ "7-1": "0", "7-2": "1" });
    const b = stateWith({ "7-1": "1", "7-2": "0" });
    expect(positionKey(a)).toBe(positionKey(b));
    expect(positionKey({ ...a, currentTeam: Team.Two })).not.toBe(positionKey(a));
    expect(positionKey({ ...a, pieces: { "0": a.pieces["0"], "1": a.pieces["1"] } })).not.toBe(positionKey(a));
  });

  it("yields to cancellation before a delayed result can be used", async () => {
    let cancelled = false;
    const timer = setTimeout(() => { cancelled = true; }, 0);
    const choice = await chooseComputerMoveAsync(createGame(), { isCancelled: () => cancelled, timeLimitMs: 1000 });
    clearTimeout(timer);
    expect(choice).toBeNull();
  });
});

it("does not highlight a near-win that a dropped piece would slide past", () => {
  const state = stateWith({ "4-2": "0", "4-3": "1", "4-5": "2" });
  expect(detectNearWins(state.board, state.pieces).map(win => coordToKey(win.emptyCoord))).not.toContain("4-4");
});
