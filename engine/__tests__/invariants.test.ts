import { createGame, placePiece } from "../game";
import { isPlayable, isSlot } from "../board";

it("rejects a second placement of an existing piece without consuming a turn", () => {
  let state = placePiece(createGame(), { row: 0, col: 1 }, "0").state;
  state = placePiece(state, { row: 0, col: 2 }, "24").state;
  const result = placePiece(state, { row: 0, col: 3 }, "0");
  expect(result.state).toBe(state);
  expect(result.events).toEqual([]);
  expect(Object.values(result.state.board).filter(id => id === "0")).toHaveLength(1);
});

it("rejects fractional or out-of-range coordinates", () => {
  expect(isPlayable({ row: 1.5, col: 2 })).toBe(false);
  expect(isSlot({ row: 0, col: 1.5 })).toBe(false);
  expect(isSlot({ row: 0, col: 99 })).toBe(false);
});
