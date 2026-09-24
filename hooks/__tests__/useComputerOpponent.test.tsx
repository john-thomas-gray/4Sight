import React from "react";
import { act, cleanup, render } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameSessionProvider, useGameSession } from "@/context/GameSessionContext";
import { LayoutProvider, useLayout } from "@/context/LayoutContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { UiProvider, useUi } from "@/context/UiContext";
import { chooseComputerMoveAsync } from "@/engine/computer";
import { Direction, Team } from "@/engine";
import { CellType } from "@/types/board";
import { loadAppState } from "@/storage";
import { TURN_CHANGE_COMMIT_DELAY_MS, TURN_CHANGE_SETTLE_BUFFER_MS } from "@/constants/logic";
import { useComputerOpponent } from "../useComputerOpponent";

jest.mock("@/engine/computer", () => ({ ...jest.requireActual("@/engine/computer"), chooseComputerMoveAsync: jest.fn() }));
const choose = jest.mocked(chooseComputerMoveAsync);
const pull = jest.fn();
const pullRef = { current: pull };
let session: ReturnType<typeof useGameSession>;
let ui: ReturnType<typeof useUi>;
function Opponent({ enabled }: { enabled: boolean }) {
  useComputerOpponent(enabled, pullRef);
  return null;
}
function Probe() {
  const current = useGameSession();
  const currentUi = useUi();
  const { registerCell } = useLayout();
  React.useLayoutEffect(() => { session = current; ui = currentUi; }, [current, currentUi]);
  React.useEffect(() => {
    const layout = { pageX: 0, pageY: 0, width: 40, height: 40 };
    registerCell({ id: "0-2", type: CellType.Slot, layout });
    registerCell({ id: "7-2", type: CellType.Space, layout });
  }, [registerCell]);
  return null;
}
function Harness({ enabled = true }: { enabled?: boolean }) {
  return <SettingsProvider><UiProvider><LayoutProvider><GameSessionProvider>
    <Probe /><Opponent enabled={enabled} />
  </GameSessionProvider></LayoutProvider></UiProvider></SettingsProvider>;
}
async function mount() {
  const view = render(<Harness />);
  await act(async () => { jest.advanceTimersByTime(20); });
  return view;
}
async function humanMove() {
  await act(async () => { await session.newGame("onePlayer"); });
  act(() => { session.dropPiece({ row: 0, col: 1 }, "0"); });
}
beforeEach(async () => {
  jest.useFakeTimers();
  await loadAppState();
  await AsyncStorage.clear();
  choose.mockReset();
  pull.mockReset();
  choose.mockResolvedValue({ move: { type: "place", slot: { row: 0, col: 2 }, pieceId: "24" },
    reason: "search", score: 0, completedDepth: 4, nodes: 100 });
});
afterEach(async () => { cleanup(); await loadAppState(); jest.useRealTimers(); });

it("responds once with an animated legal placement and saves the game mode", async () => {
  await mount();
  await humanMove();
  await act(async () => { jest.advanceTimersByTime(350); });
  expect(choose).toHaveBeenCalledTimes(1);
  expect(session.moves.getPhase()).toBe("piece");
  expect(ui.moveInProgress).toBe(true);
  await act(async () => { jest.advanceTimersByTime(TURN_CHANGE_COMMIT_DELAY_MS + TURN_CHANGE_SETTLE_BUFFER_MS); });
  expect(session.gameState.board).toEqual({ "7-1": "0", "7-2": "24" });
  expect(session.gameState.currentTeam).toBe(Team.One);
  expect(session.moves.getPhase()).toBeNull();
  expect(ui.moveInProgress).toBe(false);
  expect((await loadAppState()).session?.mode).toBe("onePlayer");
  expect(choose).toHaveBeenCalledTimes(1);
});

it("leaves two-player games and disabled tutorial or loading screens alone", async () => {
  const view = await mount();
  act(() => session.dropPiece({ row: 0, col: 1 }, "0"));
  await act(async () => { jest.advanceTimersByTime(1000); });
  expect(choose).not.toHaveBeenCalled();
  view.rerender(<Harness enabled={false} />);
  await humanMove();
  await act(async () => { jest.advanceTimersByTime(1000); });
  expect(choose).not.toHaveBeenCalled();
});

it("waits for the human animation to settle before searching", async () => {
  await mount();
  await humanMove();
  act(() => { session.moves.begin("piece"); ui.setMoveInProgress(true); });
  await act(async () => { jest.advanceTimersByTime(1000); });
  expect(choose).not.toHaveBeenCalled();
  act(() => { session.moves.finish(); ui.setMoveInProgress(false); });
  await act(async () => { jest.advanceTimersByTime(350); });
  expect(choose).toHaveBeenCalledTimes(1);
});

it("discards a search result after a reset even if the search resolves late", async () => {
  let resolve!: (value: Awaited<ReturnType<typeof chooseComputerMoveAsync>>) => void;
  choose.mockImplementation(() => new Promise(done => { resolve = done; }));
  await mount();
  await humanMove();
  await act(async () => { jest.advanceTimersByTime(350); });
  const options = choose.mock.calls[0][1]!;
  await act(async () => { await session.newGame(); });
  expect(options.isCancelled!()).toBe(true);
  await act(async () => { resolve({ move: { type: "pull", direction: Direction.Up }, reason: "search", score: 0, completedDepth: 2, nodes: 1 }); });
  expect(pull).not.toHaveBeenCalled();
  expect(session.gameState.board).toEqual({});
  expect(session.mode).toBe("onePlayer");
});

it("cancels pending thinking when the gameplay screen leaves", async () => {
  const view = await mount();
  await humanMove();
  view.rerender(<Harness enabled={false} />);
  await act(async () => { jest.advanceTimersByTime(1000); });
  expect(choose).not.toHaveBeenCalled();
  expect(session.gameState.turnCount).toBe(1);
});

it("uses the existing gravity animation callback for a selected pull", async () => {
  choose.mockResolvedValue({ move: { type: "pull", direction: Direction.Up }, reason: "defend", score: 0, completedDepth: 4, nodes: 10 });
  await mount();
  await humanMove();
  await act(async () => { jest.advanceTimersByTime(350); });
  expect(pull).toHaveBeenCalledWith(Direction.Up);
});

it("restores one-player saves and treats older saves as two-player games", async () => {
  await mount();
  await humanMove();
  const saved = (await loadAppState()).session!;
  await act(async () => { await session.newGame("twoPlayer"); });
  act(() => session.continueGame(saved));
  expect(session.mode).toBe("onePlayer");
  const { mode: _mode, ...legacy } = saved;
  act(() => session.continueGame(legacy));
  expect(session.mode).toBe("twoPlayer");
});
