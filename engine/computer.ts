import type { GameMove } from "./moves";
import { GameState, Team } from "./types";
import { SEARCH_WINDOWS, searchPositionKey, searchTransitions, teamNumber, toGameMove, toSearchPosition, type SearchPosition, type SearchTransition } from "./searchPosition";

const WIN = 1_000_000;
const other = (team: Team) => team === Team.One ? Team.Two : Team.One;

export type ComputerOptions = {
  /** Individual player actions, including the computer's current action. */
  maxDepth?: number;
  /** Deeper search budget; the complete immediate win/safety pass always finishes. */
  timeLimitMs?: number;
  maxNodes?: number;
  isCancelled?: () => boolean;
};

export type ComputerDecision = {
  move: GameMove | null;
  reason: "win" | "defend" | "fork" | "search" | "no-permitted-move" | "finished";
  completedDepth: number;
  nodes: number;
  score: number;
};

type Transition = SearchTransition;
type Candidate = Transition & { safe: boolean; threats: number; winningSquares: number; replies: number };
type Entry = { score: number; bound: "exact" | "lower" | "upper" };
type Search = Generator<void, number, void>;

/** Color occupancy, turn and reserves matter; cosmetic piece identities and turn count do not. */
export function positionKey(state: GameState): string {
  return searchPositionKey(toSearchPosition(state));
}

function evaluate(state: SearchPosition, team: Team): number {
  let score = 0;
  const weights = [0, 1, 8, 40, 0];
  for (const window of SEARCH_WINDOWS) {
    let mine = 0;
    let theirs = 0;
    for (const key of window) {
      const owner = state.cells[key];
      if (owner === teamNumber(team)) mine++;
      else if (owner) theirs++;
    }
    if (!theirs) score += weights[mine];
    if (!mine) score -= weights[theirs];
  }
  return score;
}

/** A cooperative search: yielding lets the native app render and cancel between batches. */
function* searchDecision(game: GameState, options: ComputerOptions): Generator<void, ComputerDecision, void> {
  const state = toSearchPosition(game);
  const team = state.currentTeam;
  const maxDepth = Math.max(1, Math.min(12, Math.floor(options.maxDepth ?? 4)));
  const maxNodes = Math.max(1, options.maxNodes ?? 50_000);
  const transitions = new Map<string, Transition[]>();
  const table = new Map<string, Entry>();
  let nodes = 0;
  let deadline = Infinity;
  const stopped = () => !!options.isCancelled?.() || Date.now() >= deadline || nodes >= maxNodes;

  const children = (position: SearchPosition): Transition[] => {
    if (position.status !== "playing") return [];
    const key = searchPositionKey(position);
    const cached = transitions.get(key);
    if (cached) return cached;
    const result = searchTransitions(position);
    // Bound memory even if a caller supplies a large search budget.
    if (transitions.size < 8_000) transitions.set(key, result);
    return result;
  };
  const winning = (position: SearchPosition, player: Team) =>
    position.status === "playing" ? children({ ...position, currentTeam: player }).filter(t => t.state.winner === player) : [];

  function* candidates(position: SearchPosition): Generator<void, { moves: Candidate[]; threatened: boolean }, void> {
    const player = position.currentTeam;
    const all = children(position);
    const wins = all.filter(t => t.state.winner === player);
    if (wins.length) return { moves: wins.map(t => ({ ...t, safe: true, threats: 0, winningSquares: 0, replies: 0 })), threatened: false };
    const threatened = winning(position, other(player)).length > 0;
    const annotated: Candidate[] = [];
    for (const transition of all) {
      const next = transition.state;
      const replies = next.winner === other(player) ? 1 : winning(next, other(player)).length;
      const threats = winning(next, player);
      annotated.push({ ...transition, safe: replies === 0, replies,
        threats: threats.length, winningSquares: threats.filter(t => t.move.type === "place").length });
      yield;
    }
    const placementFork = annotated.some(t => t.move.type === "place" && t.safe && t.winningSquares >= 2);
    const permitted = annotated.filter(t => t.move.type === "place" ||
      (t.safe && (threatened || (!placementFork && t.winningSquares >= 2))));
    const safe = permitted.filter(t => t.safe);
    return { moves: safe.length ? safe : permitted, threatened };
  }

  function terminal(position: SearchPosition, ply: number): number | null {
    if (position.status !== "finished") return null;
    if (position.tie) return 0;
    return position.winner === team ? WIN - ply : -WIN + ply;
  }

  function* minimax(position: SearchPosition, depth: number, alpha: number, beta: number, ply: number): Search {
    if (stopped()) throw STOP;
    nodes++;
    if (nodes % 16 === 0) yield;
    const end = terminal(position, ply);
    if (end !== null) return end;
    if (depth === 0) return evaluate(position, team);
    const key = `${depth}:${ply}:${searchPositionKey(position)}`;
    const cached = table.get(key);
    const originalAlpha = alpha;
    const originalBeta = beta;
    if (cached) {
      if (cached.bound === "exact") return cached.score;
      if (cached.bound === "lower") alpha = Math.max(alpha, cached.score);
      else beta = Math.min(beta, cached.score);
      if (alpha >= beta) return cached.score;
    }
    const maximizing = position.currentTeam === team;
    // The human may use every legal pull, regardless of the computer's play policy.
    const moves = maximizing ? (yield* candidates(position)).moves : children(position);
    if (stopped()) throw STOP;
    if (!moves.length) return evaluate(position, team);
    moves.sort((a, b) => {
      const aScore = terminal(a.state, ply + 1) ?? evaluate(a.state, team);
      const bScore = terminal(b.state, ply + 1) ?? evaluate(b.state, team);
      return maximizing ? bScore - aScore : aScore - bScore;
    });
    let score = maximizing ? -Infinity : Infinity;
    for (const move of moves) {
      const value = yield* minimax(move.state, depth - 1, alpha, beta, ply + 1);
      score = maximizing ? Math.max(score, value) : Math.min(score, value);
      if (maximizing) alpha = Math.max(alpha, score);
      else beta = Math.min(beta, score);
      if (alpha >= beta) break;
    }
    if (table.size < 20_000) table.set(key, { score, bound: score <= originalAlpha ? "upper" : score >= originalBeta ? "lower" : "exact" });
    return score;
  }

  if (state.status !== "playing") return { move: null, reason: "finished", completedDepth: 0, nodes, score: 0 };
  const root = yield* candidates(state);
  if (!root.moves.length) return { move: null, reason: "no-permitted-move", completedDepth: 0, nodes, score: 0 };
  // Heuristics break ties only; a proven result always outranks apparent threats.
  root.moves.sort((a, b) => b.winningSquares - a.winningSquares || b.threats - a.threats || a.replies - b.replies ||
    evaluate(b.state, team) - evaluate(a.state, team) || Number(a.move.type === "pull") - Number(b.move.type === "pull"));
  let best = root.moves[0];
  let bestScore = terminal(best.state, 1) ?? (best.safe ? evaluate(best.state, team) : -WIN + 2);
  let completedDepth = best.state.winner === team ? 1 : 2;
  if (best.state.winner !== team) {
    deadline = Date.now() + Math.max(0, options.timeLimitMs ?? 500);
    for (let depth = 2; depth <= maxDepth; depth++) {
      let iterationBest = best;
      let iterationScore = -Infinity;
      try {
        // Keep a complete root comparison; interrupted iterations never replace the last result.
        for (const candidate of root.moves) {
          const value = yield* minimax(candidate.state, depth - 1, iterationScore, Infinity, 1);
          if (value > iterationScore) { iterationScore = value; iterationBest = candidate; }
        }
      } catch (error) {
        if (error !== STOP) throw error;
        break;
      }
      best = iterationBest;
      bestScore = iterationScore;
      completedDepth = depth;
      if (Math.abs(bestScore) > WIN / 2) break;
    }
  }
  return { move: toGameMove(game, best.move), reason: best.state.winner === team ? "win" : root.threatened ? "defend" : bestScore > WIN / 2 ? "fork" : "search",
    completedDepth, nodes, score: bestScore };
}

const STOP = Symbol("search budget reached");

/** Deterministic entry point for tests, analysis and non-interactive callers. */
export function chooseComputerMove(state: GameState, options: ComputerOptions = {}): ComputerDecision {
  const search = searchDecision(state, options);
  let next = search.next();
  while (!next.done) next = search.next();
  return next.value;
}

/** Search in short batches, releasing the event loop for animation and navigation. */
export async function chooseComputerMoveAsync(state: GameState, options: ComputerOptions = {}): Promise<ComputerDecision | null> {
  const search = searchDecision(state, options);
  while (!options.isCancelled?.()) {
    const sliceEnd = Date.now() + 8;
    do {
      const next = search.next();
      if (next.done) return options.isCancelled?.() ? null : next.value;
      if (options.isCancelled?.()) return null;
    } while (Date.now() < sliceEnd);
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }
  return null;
}
