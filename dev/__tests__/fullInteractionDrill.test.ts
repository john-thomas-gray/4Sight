import { resolveDropOutcome } from "@/components/pieceDropController";
import { scenarios } from "@/dev/scenarios";
import type { ScenarioMove } from "@/dev/scenarios";
import {
  applyGravity,
  createGame,
  Direction,
  findSlotForSpace,
  placePiece,
  shiftGravity,
  Team,
} from "@/engine";
import type { GameState } from "@/engine";

function playScenarioMoves(
  initial: Pick<GameState, "board" | "currentTeam">,
  moves: ScenarioMove[],
): GameState {
  let state: GameState = {
    ...createGame(),
    board: { ...initial.board },
    currentTeam: initial.currentTeam,
  };

  for (const move of moves) {
    if (move.type === "gravity") {
      const { state: next } = shiftGravity(state, move.direction);
      state = next;
    } else {
      const slot = findSlotForSpace(state.board, move.targetSpace);
      if (!slot) {
        throw new Error(
          `No slot for ${move.pieceId} at ${move.targetSpace.row}-${move.targetSpace.col}`,
        );
      }
      const { state: next } = placePiece(state, slot, move.pieceId);
      state = next;
    }
  }

  return state;
}

describe("fullInteractionDrill scenario", () => {
  it("runs four scripted pulls on a lone piece (column 1), then stacks and wins", () => {
    const scenario = scenarios.fullInteractionDrill;
    expect(scenario).toBeDefined();

    const end = playScenarioMoves(
      { board: scenario.board, currentTeam: scenario.currentTeam },
      scenario.moves,
    );

    expect(end.board["1-1"]).toBe("10");
    expect(end.board["3-3"]).toBe("2");
    expect(end.board["3-4"]).toBe("5");
    expect(end.board["3-5"]).toBe("8");
    expect(end.board["3-6"]).toBe("9");
    expect(end.status).toBe("finished");
    expect(end.tie).toBe(false);
    expect(end.winner).toBe(Team.One);
  });

  it("moves the wanderer through four interior gravity pulls (ends back on 1-1)", () => {
    const scenario = scenarios.fullInteractionDrill;
    const state = playScenarioMoves(
      { board: scenario.board, currentTeam: scenario.currentTeam },
      scenario.moves.slice(0, 4),
    );
    expect(state.board["1-1"]).toBe("10");
    expect(state.currentTeam).toBe(Team.One);
  });

  it("preview pull (applyGravity) moves pieces for each cardinal direction", () => {
    const board = { "4-4": "0" };
    for (const direction of [
      Direction.Up,
      Direction.Down,
      Direction.Left,
      Direction.Right,
    ]) {
      const { moves } = applyGravity(board, direction);
      expect(moves.length).toBeGreaterThan(0);
    }
  });

  it("tieGame scenario ends in a draw after scripted gravity", () => {
    const { board, currentTeam, moves } = scenarios.tieGame;
    const end = playScenarioMoves({ board, currentTeam }, moves);
    expect(end.status).toBe("finished");
    expect(end.tie).toBe(true);
    expect(end.winner).toBeNull();
  });

  it("shiftGravity is a no-op once the engine reports finished (swipe handler may reset elsewhere)", () => {
    const scenario = scenarios.fullInteractionDrill;
    const finished = playScenarioMoves(
      { board: scenario.board, currentTeam: scenario.currentTeam },
      scenario.moves,
    );
    const { state, events } = shiftGravity(finished, Direction.Down);
    expect(state).toBe(finished);
    expect(events).toHaveLength(0);
  });
});

describe("piece drop outcomes (slot, space, blocked, occupied well)", () => {
  const slotIds: Record<string, unknown> = { "0-4": 1 };
  const spaceIds: Record<string, unknown> = { "4-4": 1, "2-4": 1 };
  const wellIds: Record<string, unknown> = { "well-1": 1 };
  const ORIGIN_WELL = "well-0";

  it("blocked slot, space drop, occupied space, and empty well cell", () => {
    expect(
      resolveDropOutcome(
        "0-4",
        { "1-4": "blocker" },
        slotIds,
        spaceIds,
        wellIds,
        {},
        ORIGIN_WELL,
      ),
    ).toMatchObject({ kind: "blockedSlot", blockingPieceId: "blocker" });

    expect(
      resolveDropOutcome(
        "2-4",
        { "3-4": "x" },
        slotIds,
        spaceIds,
        wellIds,
        {},
        ORIGIN_WELL,
      ),
    ).toMatchObject({ kind: "placed", landingKey: "2-4" });

    expect(
      resolveDropOutcome(
        "4-4",
        { "4-4": "occupant" },
        slotIds,
        spaceIds,
        wellIds,
        {},
        ORIGIN_WELL,
      ),
    ).toEqual({ kind: "returnToWell", originWellId: ORIGIN_WELL });

    expect(
      resolveDropOutcome("well-1", {}, slotIds, spaceIds, wellIds, {}, ORIGIN_WELL),
    ).toEqual({ kind: "well", wellId: "well-1" });
  });
});
