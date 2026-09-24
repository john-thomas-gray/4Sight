import React from "react";
import { act, cleanup, render } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View } from "react-native";
import { GameSessionProvider, useGameSession } from "@/context/GameSessionContext";
import { LayoutProvider, useLayout } from "@/context/LayoutContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { UiProvider, useUi } from "@/context/UiContext";
import { usePlayfieldAnimations } from "@/hooks/usePlayfieldAnimations";
import { createGame, Direction, Team } from "@/engine";
import { gameStateToSerializable, loadAppState } from "@/storage";
import { CellType } from "@/types/board";
import { RESET_TO_WELL_TOTAL_MS } from "@/types/animation";
import GravityGestureLayer from "../GravityGestureLayer";

let mockPreview: (event: { absoluteX: number; absoluteY: number }) => void;
let mockFling: (event: { velocityX: number; velocityY: number }) => void;
jest.mock("react-native-gesture-handler", () => ({
  Gesture: {
    LongPress: () => {
      const gesture = {
        runOnJS: () => gesture, enabled: () => gesture, minDuration: () => gesture,
        onStart: (callback: typeof mockPreview) => { mockPreview = callback; return gesture; },
        onFinalize: () => gesture,
      };
      return gesture;
    },
    Pan: () => {
      const gesture = {
        runOnJS: () => gesture, enabled: () => gesture,
        onEnd: (callback: typeof mockFling) => { mockFling = callback; return gesture; },
      };
      return gesture;
    },
    Simultaneous: (...gestures: unknown[]) => gestures,
  },
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
}));

let session: ReturnType<typeof useGameSession>;
let ui: ReturnType<typeof useUi>;
const pullRef: { current: ((direction: Direction) => void) | null } = { current: null };
function Probe() {
  const current = useGameSession();
  const currentUi = useUi();
  React.useLayoutEffect(() => { session = current; ui = currentUi; }, [current, currentUi]);
  return null;
}
function Cells() {
  const { registerCell } = useLayout();
  React.useEffect(() => {
    for (let row = 1; row <= 7; row++) for (let col = 1; col <= 7; col++) {
      registerCell({ id: `${row}-${col}`, type: CellType.Space,
        layout: { pageX: (col - 1) * 40, pageY: (row - 1) * 40, width: 40, height: 40 } });
    }
    registerCell({ id: "9-9", type: CellType.Well, team: Team.One,
      layout: { pageX: 40, pageY: 400, width: 40, height: 40 } });
    registerCell({ id: "17-12", type: CellType.Well, team: Team.Two,
      layout: { pageX: 40, pageY: -100, width: 40, height: 40 } });
  }, [registerCell]);
  return null;
}
function PositionPieces() {
  usePlayfieldAnimations({ allPlayfieldCellsReady: false, showLoadingScreen: true });
  return <GravityGestureLayer pullRef={pullRef}><View /></GravityGestureLayer>;
}
function Harness({ showBoard = true }: { showBoard?: boolean }) {
  return <SettingsProvider><UiProvider><LayoutProvider><GameSessionProvider>
    <Cells /><Probe />{showBoard && <PositionPieces />}
  </GameSessionProvider></LayoutProvider></UiProvider></SettingsProvider>;
}
const piecePosition = () => [session.pieceAnims["0"].translateX.value, session.pieceAnims["0"].translateY.value];
async function mount() {
  const view = render(<Harness />);
  await act(async () => { jest.advanceTimersByTime(20); });
  act(() => session.loadScenario({ board: { "4-4": "0" }, currentTeam: Team.One, moves: [] }));
  expect(piecePosition()).toEqual([124, 124]);
  return view;
}
beforeEach(async () => { jest.useFakeTimers(); await loadAppState(); await AsyncStorage.clear(); });
afterEach(async () => { cleanup(); await loadAppState(); jest.useRealTimers(); });

it("ignores a previous game's gravity callback instead of animating ghost pieces", async () => {
  await mount();
  const stalePull = pullRef.current!;
  await act(async () => { await session.newGame(); });
  expect(piecePosition()).toEqual([44, 404]);
  act(() => stalePull(Direction.Up));
  await act(async () => { jest.advanceTimersByTime(2000); });
  expect(session.gameState.board).toEqual({});
  expect(piecePosition()).toEqual([44, 404]);
  expect(session.moves.getPhase()).toBeNull();
});

it("cannot restore the previous board through a delayed gravity preview", async () => {
  await mount();
  const stalePreview = mockPreview;
  await act(async () => { await session.newGame(); });
  act(() => stalePreview({ absoluteX: 140, absoluteY: 20 }));
  expect(ui.gravityPreviewBoard).toBeNull();
  expect(ui.isPreviewingGravity).toBe(false);
});

it("a delayed fling from a finished game cannot reset the replacement game", async () => {
  await mount();
  act(() => session.loadScenario({ board: { "7-1": "0", "7-2": "1", "7-3": "2" }, currentTeam: Team.One, moves: [] }));
  act(() => session.dropPiece({ row: 7, col: 8 }, "3"));
  expect(session.gameState.status).toBe("finished");
  const staleFling = mockFling;
  await act(async () => { await session.newGame(); });
  act(() => session.dropPiece({ row: 0, col: 1 }, "0"));
  act(() => staleFling({ velocityX: 0, velocityY: -800 }));
  await act(async () => { jest.advanceTimersByTime(RESET_TO_WELL_TOTAL_MS + 100); });
  expect(session.gameState.board).toEqual({ "7-1": "0" });
});

it("keeps old pieces cleared after the animated reset following a win", async () => {
  await mount();
  const stalePull = pullRef.current!;
  const stalePreview = mockPreview;
  act(() => session.loadScenario({ board: { "7-1": "0", "7-2": "1", "7-3": "2" }, currentTeam: Team.One, moves: [] }));
  act(() => session.dropPiece({ row: 7, col: 8 }, "3"));
  expect(session.gameState.status).toBe("finished");
  const finishedGameFling = mockFling;
  act(() => finishedGameFling({ velocityX: 0, velocityY: -800 }));
  expect(session.moves.getPhase()).toBe("reset");
  await act(async () => { jest.advanceTimersByTime(RESET_TO_WELL_TOTAL_MS + 100); });
  expect(session.gameState.board).toEqual({});
  expect(piecePosition()).toEqual([44, 404]);
  act(() => {
    stalePull(Direction.Up);
    stalePreview({ absoluteX: 140, absoluteY: 20 });
    finishedGameFling({ velocityX: 0, velocityY: -800 });
  });
  await act(async () => { jest.advanceTimersByTime(2000); });
  expect(session.gameState.board).toEqual({});
  expect(piecePosition()).toEqual([44, 404]);
  expect(ui.gravityPreviewBoard).toBeNull();
  expect(session.moves.getPhase()).toBeNull();
});

it("resets piece coordinates with the session even while the gameplay screen is unmounted", async () => {
  const view = await mount();
  view.rerender(<Harness showBoard={false} />);
  await act(async () => { await session.newGame(); });
  expect(session.gameState.board).toEqual({});
  expect(piecePosition()).toEqual([44, 404]);
});

it("rejects callbacks from an unmounted screen even if its game has not changed", async () => {
  const view = await mount();
  const stalePull = pullRef.current!;
  const stalePreview = mockPreview;
  view.rerender(<Harness showBoard={false} />);
  expect(pullRef.current).toBeNull();
  act(() => {
    stalePull(Direction.Up);
    stalePreview({ absoluteX: 140, absoluteY: 20 });
  });
  await act(async () => { jest.advanceTimersByTime(2000); });
  expect(session.gameState.board).toEqual({ "4-4": "0" });
  expect(piecePosition()).toEqual([124, 124]);
  expect(ui.gravityPreviewBoard).toBeNull();
});

it("continues to animate and commit a fresh gravity pull after replacing the game", async () => {
  await mount();
  await act(async () => { await session.newGame(); });
  act(() => session.loadScenario({ board: { "4-4": "0" }, currentTeam: Team.One, moves: [] }));
  act(() => pullRef.current!(Direction.Up));
  await act(async () => { jest.advanceTimersByTime(2000); });
  expect(session.gameState.board).toEqual({ "1-4": "0" });
  expect(piecePosition()).toEqual([124, 4]);
  expect(session.moves.getPhase()).toBeNull();
});

it("reconciles board and well positions before a continued game mounts", async () => {
  const view = await mount();
  view.rerender(<Harness showBoard={false} />);
  act(() => session.continueGame({
    game: gameStateToSerializable({ ...createGame(), board: { "4-4": "24" }, turnCount: 1 }),
    pieceStatusMap: {}, wellPieceLocations: {},
  }));
  expect(piecePosition()).toEqual([44, 404]);
  expect([session.pieceAnims["24"].translateX.value, session.pieceAnims["24"].translateY.value]).toEqual([124, 124]);
});
