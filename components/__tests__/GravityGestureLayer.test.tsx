import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, cleanup, render } from "@testing-library/react-native";
import React from "react";
import { View } from "react-native";
import { GameSessionProvider, useGameSession } from "@/context/GameSessionContext";
import { LayoutProvider, useLayout } from "@/context/LayoutContext";
import { PlayfieldFrameProvider } from "@/context/PlayfieldFrameContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { UiProvider, useUi } from "@/context/UiContext";
import { Team } from "@/engine";
import { loadAppState } from "@/storage";
import { CellType } from "@/types/board";
import GravityGestureLayer, { PREVIEW_HOLD_MS } from "../GravityGestureLayer";
import PieceView from "../PieceView";

type LongPressEvent = { absoluteX: number; absoluteY: number };
type LongPressGesture = {
  enabled?: boolean;
  minDuration?: number;
  onStart?: (event: LongPressEvent) => void;
  onFinalize?: () => void;
};

let mockLongPressGesture: LongPressGesture;

jest.mock("react-native-gesture-handler", () => ({
  Gesture: {
    LongPress: () => {
      const gesture = {
        runOnJS: () => gesture,
        enabled: (value: boolean) => {
          mockLongPressGesture.enabled = value;
          return gesture;
        },
        minDuration: (value: number) => {
          mockLongPressGesture.minDuration = value;
          return gesture;
        },
        onStart: (callback: (event: LongPressEvent) => void) => {
          mockLongPressGesture.onStart = callback;
          return gesture;
        },
        onFinalize: (callback: () => void) => {
          mockLongPressGesture.onFinalize = callback;
          return gesture;
        },
      };
      mockLongPressGesture = {};
      return gesture;
    },
    Pan: () => {
      const gesture = {
        runOnJS: () => gesture,
        enabled: () => gesture,
        onEnd: () => gesture,
      };
      return gesture;
    },
    Simultaneous: (...gestures: unknown[]) => gestures,
  },
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("../SurfaceGradient", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../Glow", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../usePieceGesture", () => ({
  usePieceGesture: () => ({}),
}));

let session: ReturnType<typeof useGameSession>;
let ui: ReturnType<typeof useUi>;

function Probe() {
  const currentSession = useGameSession();
  const currentUi = useUi();
  React.useLayoutEffect(() => {
    session = currentSession;
    ui = currentUi;
  }, [currentSession, currentUi]);
  return null;
}

function Cells() {
  const { registerCell } = useLayout();
  React.useEffect(() => {
    for (let row = 1; row <= 7; row += 1) {
      for (let col = 1; col <= 7; col += 1) {
        registerCell({
          id: `${row}-${col}`,
          type: CellType.Space,
          layout: {
            pageX: (col - 1) * 40,
            pageY: (row - 1) * 40,
            width: 40,
            height: 40,
          },
        });
      }
    }
  }, [registerCell]);
  return null;
}

function Harness() {
  return (
    <SettingsProvider>
      <UiProvider>
        <LayoutProvider>
          <GameSessionProvider>
            <PlayfieldFrameProvider>
              <Cells />
              <Probe />
              <GravityGestureLayer>
                <View />
              </GravityGestureLayer>
              <PieceView id="0" team={Team.One} />
            </PlayfieldFrameProvider>
          </GameSessionProvider>
        </LayoutProvider>
      </UiProvider>
    </SettingsProvider>
  );
}

describe("GravityGestureLayer", () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    await loadAppState();
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    cleanup();
    await loadAppState();
    jest.useRealTimers();
  });

  it("shows opposite-side pull previews after a 0.2 second hold and lets board pieces pass touches through", async () => {
    const { getByTestId } = render(<Harness />);

    await act(async () => {
      jest.advanceTimersByTime(20);
    });

    act(() => {
      session.loadScenario({
        board: { "4-4": "0" },
        currentTeam: Team.One,
        moves: [],
      });
    });

    expect(mockLongPressGesture.minDuration).toBe(PREVIEW_HOLD_MS);
    expect(PREVIEW_HOLD_MS).toBe(200);
    expect(ui.isPreviewingGravity).toBe(false);
    expect(getByTestId("piece-0")).not.toHaveStyle({ opacity: 0 });

    act(() => {
      mockLongPressGesture.onStart?.({ absoluteX: 140, absoluteY: 20 });
    });

    expect(ui.isPreviewingGravity).toBe(true);
    expect(ui.gravityPreviewBoard?.["7-4"]).toBe("0");
    expect(ui.gravityPreviewBoard?.["4-4"]).toBeUndefined();
    expect(getByTestId("piece-0")).toHaveStyle({ opacity: 0 });
    expect(getByTestId("piece-0")).toHaveProp("pointerEvents", "none");

    act(() => {
      mockLongPressGesture.onFinalize?.();
    });

    expect(ui.isPreviewingGravity).toBe(false);
    expect(ui.gravityPreviewBoard).toBeNull();
  });
});
