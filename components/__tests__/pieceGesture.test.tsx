import React from "react";
import { act, cleanup, render } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameSessionProvider, useGameSession } from "@/context/GameSessionContext";
import { LayoutProvider, useLayout } from "@/context/LayoutContext";
import { SettingsProvider, useSettings } from "@/context/SettingsContext";
import { UiProvider, useUi } from "@/context/UiContext";
import { Team } from "@/engine";
import { CellType } from "@/types/board";
import { TURN_CHANGE_COMMIT_DELAY_MS, TURN_CHANGE_SETTLE_BUFFER_MS } from "@/constants/logic";
import { loadAppState } from "@/storage";
import { usePieceGesture } from "../usePieceGesture";

type Pointer = { absoluteX: number; absoluteY: number };
type Handlers = { onStart: () => void; onUpdate: (event: Pointer) => void; onEnd: (event: Pointer) => void; onFinalize: () => void };
let mockGesture: Handlers;
jest.mock("react-native-gesture-handler", () => ({
  Gesture: {
    Pan: () => {
      const handlers: Partial<Handlers> = {};
      mockGesture = handlers as Handlers;
      const gesture: Record<string, (value: unknown) => unknown> = {};
      for (const name of ["enabled", "hitSlop"]) gesture[name] = () => gesture;
      for (const name of ["onStart", "onUpdate", "onEnd", "onFinalize"] as const) {
        gesture[name] = callback => { handlers[name] = callback as never; return gesture; };
      }
      return gesture;
    },
  },
}));
let session: ReturnType<typeof useGameSession>;
let ui: ReturnType<typeof useUi>;
let settings: ReturnType<typeof useSettings>;
const noMotion = () => {};
function Probe() {
  const currentSession = useGameSession(); const currentUi = useUi(); const currentSettings = useSettings();
  React.useLayoutEffect(() => { session = currentSession; ui = currentUi; settings = currentSettings; }, [currentSession, currentUi, currentSettings]);
  return null;
}
function DragPiece() {
  const current = useGameSession();
  usePieceGesture({ id: "0", team: Team.One, animate: current.pieceAnims["0"], status: current.pieceStatusMap["0"],
    startHeldJiggle: noMotion, stopHeldJiggle: noMotion, reversePieceLift: noMotion, returnPieceLiftToWell: noMotion });
  return null;
}
function Cells() {
  const { registerCell } = useLayout();
  React.useEffect(() => {
    registerCell({ id: "9-9", type: CellType.Well, team: Team.One, layout: { pageX: 0, pageY: 400, width: 40, height: 40 } });
    registerCell({ id: "0-1", type: CellType.Slot, layout: { pageX: 0, pageY: 0, width: 40, height: 40 } });
    registerCell({ id: "7-1", type: CellType.Space, layout: { pageX: 0, pageY: 280, width: 40, height: 40 } });
  }, [registerCell]);
  return null;
}
function Harness({ showPiece = true }: { showPiece?: boolean }) {
  return <SettingsProvider><UiProvider><LayoutProvider><GameSessionProvider>
    <Cells /><Probe />{showPiece && <DragPiece />}
  </GameSessionProvider></LayoutProvider></UiProvider></SettingsProvider>;
}
async function mount() {
  const view = render(<Harness />);
  await act(async () => { jest.advanceTimersByTime(20); });
  return view;
}
const slotPointer = { absoluteX: 20, absoluteY: 70 }; // Team One lifts the piece 50 pixels above the finger.
beforeEach(async () => { jest.useFakeTimers(); await loadAppState(); await AsyncStorage.clear(); });
afterEach(async () => { cleanup(); await loadAppState(); jest.useRealTimers(); });

it("restores well membership and unlocks input after native cancellation", async () => {
  await mount();
  act(() => mockGesture.onStart());
  act(() => mockGesture.onUpdate(slotPointer));
  expect(ui.hoverPreview).toEqual({ spaceId: "7-1", team: Team.One });
  expect(session.pieceAnims["0"].translateX.value).toBe(4);
  expect(session.pieceAnims["0"].translateY.value).toBe(4);
  act(() => mockGesture.onFinalize());
  expect(session.pieceStatusMap["0"]).toBe("inWell");
  expect(session.wellPieceLocations["9-9"]).toBe("0");
  expect(ui.moveInProgress).toBe(false);
  expect(ui.hoverPreview).toBeNull();
  expect(session.moves.getPhase()).toBeNull();
});

it("previews and commits a drop through the same slot resolution", async () => {
  await mount();
  act(() => mockGesture.onStart());
  act(() => mockGesture.onUpdate(slotPointer));
  const preview = ui.hoverPreview;
  act(() => { mockGesture.onEnd(slotPointer); mockGesture.onFinalize(); });
  expect(session.gameState.board).toEqual({});
  await act(async () => { jest.advanceTimersByTime(TURN_CHANGE_COMMIT_DELAY_MS); });
  expect(session.gameState.board[preview!.spaceId]).toBe("0");
  expect(session.pieceStatusMap["0"]).toBe("onBoard");
  expect(Object.values(session.wellPieceLocations)).not.toContain("0");
  expect(ui.hoverPreview).toBeNull();
  await act(async () => { jest.advanceTimersByTime(TURN_CHANGE_SETTLE_BUFFER_MS); });
  expect(ui.moveInProgress).toBe(false);
  expect(session.moves.getPhase()).toBeNull();
});

it("honors disabled previews while continuing to update drag position", async () => {
  await mount();
  act(() => settings.setPiecePlacementPreviews(false));
  act(() => mockGesture.onStart());
  act(() => mockGesture.onUpdate(slotPointer));
  expect(ui.hoverPreview).toBeNull();
  expect(session.pieceAnims["0"].translateY.value).toBe(4);
});

it("ignores an old gesture release after a reset", async () => {
  await mount();
  act(() => mockGesture.onStart());
  const oldGesture = mockGesture;
  await act(async () => { await session.newGame(); });
  act(() => { oldGesture.onEnd(slotPointer); oldGesture.onFinalize(); });
  await act(async () => { jest.advanceTimersByTime(2000); });
  expect(session.gameState.board).toEqual({});
  expect(session.wellPieceLocations["9-9"]).toBe("0");
  expect(ui.moveInProgress).toBe(false);
});

it("cancels an unmounted piece's pending placement while the session stays mounted", async () => {
  const view = await mount();
  act(() => mockGesture.onStart());
  act(() => mockGesture.onEnd(slotPointer));
  view.rerender(<Harness showPiece={false} />);
  await act(async () => { jest.advanceTimersByTime(2000); });
  expect(session.gameState.board).toEqual({});
  expect(session.wellPieceLocations["9-9"]).toBe("0");
  expect(ui.moveInProgress).toBe(false);
});

it("unmounting just after commit releases the remaining settle lock", async () => {
  const view = await mount();
  act(() => mockGesture.onStart());
  act(() => mockGesture.onEnd(slotPointer));
  await act(async () => { jest.advanceTimersByTime(TURN_CHANGE_COMMIT_DELAY_MS); });
  view.rerender(<Harness showPiece={false} />);
  expect(session.gameState.board).toEqual({ "7-1": "0" });
  expect(ui.moveInProgress).toBe(false);
  expect(session.moves.getPhase()).toBeNull();
});
