import { createMoveCoordinator } from "../moveCoordinator";

describe("move coordinator", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("cancels old commits and resolves interrupted waits without blocking a new move", async () => {
    const moves = createMoveCoordinator();
    const oldCommit = jest.fn();
    const newCommit = jest.fn();
    moves.begin("piece");
    moves.schedule(oldCommit, 300);
    const waiting = moves.wait(400);
    moves.cancelAll();
    await expect(waiting).resolves.toBe(false);
    expect(moves.begin("gravity")).toBe(true);
    moves.schedule(newCommit, 100);
    jest.advanceTimersByTime(500);
    expect(oldCommit).not.toHaveBeenCalled();
    expect(newCommit).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("admits only one interaction and notifies active gestures on cancellation", () => {
    const moves = createMoveCoordinator();
    const restore = jest.fn();
    const unsubscribe = moves.onCancel(restore);
    expect(moves.begin("piece")).toBe(true);
    expect(moves.begin("gravity")).toBe(false);
    moves.cancelAll();
    expect(restore).toHaveBeenCalledTimes(1);
    expect(moves.begin("reset")).toBe(true);
    unsubscribe();
    moves.cancelAll();
    expect(restore).toHaveBeenCalledTimes(1);
  });
});
