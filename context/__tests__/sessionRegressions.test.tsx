import React from "react";
import { act, cleanup, render } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Reanimated from "react-native-reanimated";
import { GameSessionProvider, useGameSession, useGameSessionSelector } from "../GameSessionContext";
import { LayoutProvider } from "../LayoutContext";
import { SettingsProvider } from "../SettingsContext";
import { UiProvider, useUi } from "../UiContext";
import { runScriptedPlaceFromWell } from "@/dev/scriptedPlaceFromWell";
import { TURN_CHANGE_COMMIT_DELAY_MS, TURN_CHANGE_SETTLE_BUFFER_MS } from "@/constants/logic";
import { loadAppState } from "@/storage";
import { PieceStatus } from "@/types/pieceStatus";
import { Direction } from "@/engine";

let session: ReturnType<typeof useGameSession>;
let ui: ReturnType<typeof useUi>;
const otherPieceRender = jest.fn();
function OtherPiece() {
  const status = useGameSessionSelector(value => value.pieceStatusMap["5"]);
  otherPieceRender(status);
  return null;
}
function Probe() {
  const currentSession = useGameSession(); const currentUi = useUi();
  React.useLayoutEffect(() => { session = currentSession; ui = currentUi; }, [currentSession, currentUi]);
  return null;
}
export function SessionTestProviders({ children }: { children?: React.ReactNode }) {
  return <SettingsProvider><UiProvider><LayoutProvider><GameSessionProvider>
    <Probe /><OtherPiece />{children}
  </GameSessionProvider></LayoutProvider></UiProvider></SettingsProvider>;
}

beforeEach(async () => {
  jest.useFakeTimers();
  await loadAppState();
  await AsyncStorage.clear();
  otherPieceRender.mockClear();
});
afterEach(async () => { cleanup(); await loadAppState(); jest.restoreAllMocks(); jest.useRealTimers(); });
async function mount() { const result = render(<SessionTestProviders />); await act(async () => {}); return result; }

it("updates board, status and wells atomically and reads consecutive commands from the current state", async () => {
  await mount();
  act(() => {
    session.dropPiece({ row: 0, col: 1 }, "0");
    session.dropPiece({ row: 0, col: 2 }, "24");
  });
  expect(session.gameState.board).toEqual({ "7-1": "0", "7-2": "24" });
  expect(session.gameState.turnCount).toBe(2);
  expect(session.pieceStatusMap["0"]).toBe(PieceStatus.onBoard);
  expect(Object.values(session.wellPieceLocations)).not.toContain("0");
  expect(Object.values(session.wellPieceLocations)).not.toContain("24");
  const saved = await loadAppState();
  expect(saved.session?.game.board).toEqual(session.gameState.board);
});

it("creates animation values once and skips unrelated piece subscribers", async () => {
  const spy = jest.spyOn(Reanimated, "makeMutable");
  await mount();
  const animations = session.pieceAnims;
  spy.mockClear(); otherPieceRender.mockClear();
  act(() => { session.beginPieceDrag("0"); });
  expect(session.pieceAnims).toBe(animations);
  expect(spy).not.toHaveBeenCalled();
  expect(otherPieceRender).not.toHaveBeenCalled();
  act(() => session.returnPieceToWell("0"));
  expect(Object.values(session.wellPieceLocations)).toContain("0");
});

it("cancels a scripted placement before newGame so the previous board cannot return", async () => {
  await mount();
  act(() => { session.dropPiece({ row: 0, col: 1 }, "0"); });
  act(() => {
    expect(runScriptedPlaceFromWell({
      moves: session.moves, beginPieceDrag: session.beginPieceDrag, returnPieceToWell: session.returnPieceToWell,
      board: session.gameState.board, slotCoord: { row: 0, col: 2 }, pieceId: "24",
      layout: { slots: { "0-2": { pageX: 0, pageY: 0, width: 40, height: 40 } }, spaces: { "7-2": { pageX: 0, pageY: 280, width: 40, height: 40 } } },
      pieceAnims: session.pieceAnims, setMoveInProgress: ui.setMoveInProgress, dropPiece: session.dropPiece,
    })).toBe(true);
  });
  await act(async () => { await session.newGame(); });
  await act(async () => { jest.advanceTimersByTime(TURN_CHANGE_COMMIT_DELAY_MS + TURN_CHANGE_SETTLE_BUFFER_MS); });
  expect(session.gameState.board).toEqual({});
  expect(session.gameState.turnCount).toBe(0);
  expect(Object.values(session.wellPieceLocations)).toHaveLength(48);
  expect(session.moves.getPhase()).toBeNull();
  expect(ui.moveInProgress).toBe(false);
});

it("restores a held piece on navigation and rejects conflicting commands during a move", async () => {
  await mount();
  act(() => { expect(session.beginPieceDrag("0")).toBe(true); ui.setMoveInProgress(true); });
  expect(session.shiftGravity(Direction.Down).events).toEqual([]);
  expect(session.dropPiece({ row: 0, col: 3 }, "1").events).toEqual([]);
  act(() => session.cancelPendingMoves());
  expect(session.pieceStatusMap["0"]).toBe(PieceStatus.inWell);
  expect(Object.values(session.wellPieceLocations)).toContain("0");
  expect(ui.moveInProgress).toBe(false);
});

it("resolves a cancelled reset and leaves the next game intact", async () => {
  await mount();
  act(() => { session.dropPiece({ row: 0, col: 1 }, "0"); });
  let reset!: Promise<void>;
  act(() => { reset = session.resetCurrentGame(); });
  expect(session.moves.getPhase()).toBe("reset");
  await act(async () => { await session.newGame(); await reset; });
  await act(async () => { jest.runOnlyPendingTimers(); });
  expect(session.gameState.board).toEqual({});
  expect(session.moves.getPhase()).toBeNull();
});
