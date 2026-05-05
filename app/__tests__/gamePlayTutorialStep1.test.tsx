import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, render, waitFor } from "@testing-library/react-native";
import { Team } from "@/engine";
import { CellType } from "@/types/board";
import React from "react";
import { Text } from "react-native";
import { GameSessionProvider } from "@/context/GameSessionContext";
import { LayoutProvider, useLayout } from "@/context/LayoutContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { UiProvider, useUi } from "@/context/UiContext";

const mockReplace = jest.fn();
const mockParams = { scenario: "tutorialStep1", tutorialStep: "1" };

jest.mock("expo-sensors", () => ({
  Accelerometer: {
    addListener: jest.fn(),
    isAvailableAsync: jest.fn(),
    setUpdateInterval: jest.fn(),
  },
}));

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ replace: mockReplace }),
}));

const mockBackButton = () => <Text>Back</Text>;
const mockLayout = { pageX: 0, pageY: 0, width: 40, height: 40 };
const mockBoardGridViewWithLayout = function MockBoardGridViewWithLayout() {
  const { registerCell } = useLayout();
  React.useEffect(() => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const id = `${row}-${col}`;
        const isCorner =
          (row === 0 || row === 8) && (col === 0 || col === 8);
        const isSlot =
          ((row === 0 || row === 8) && col > 0 && col < 8) ||
          ((col === 0 || col === 8) && row > 0 && row < 8);
        registerCell({
          id,
          type: isCorner
            ? CellType.Corner
            : isSlot
              ? CellType.Slot
              : CellType.Space,
          layout: mockLayout,
        });
      }
    }
  }, [registerCell]);
  return <Text>Board</Text>;
};
const mockGravityGestureLayer = function MockGravityGestureLayer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { gravityPullEnabled, tutorialPiecePickupLocked } = useUi();
  return (
    <>
      <Text testID="gravity-pulls">{String(gravityPullEnabled)}</Text>
      <Text testID="pickup-locked">{String(tutorialPiecePickupLocked)}</Text>
      {children}
    </>
  );
};
const mockLoadingScreen = () => null;
const mockPieceView = ({ id }: { id: string }) => (
  <Text testID="tutorial-piece">{id}</Text>
);
const mockSlotRim = ({ id }: { id: string }) => (
  <Text testID="slot-rim">{id}</Text>
);
const mockTeamWellGrid = function MockTeamWellGrid({ team }: { team: Team }) {
  const { registerCell } = useLayout();
  React.useEffect(() => {
    const rowOffset = team === Team.One ? 9 : 17;
    const columnOffset = team === Team.One ? 9 : 12;
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 8; row++) {
        registerCell({
          id: `${row + rowOffset}-${col + columnOffset}`,
          type: CellType.Well,
          team,
          layout: mockLayout,
        });
      }
    }
  }, [registerCell, team]);
  return <Text>{team}</Text>;
};
const mockTutorialStepBanner = ({
  visible,
  message,
}: {
  visible: boolean;
  message: string;
}) => (visible ? <Text testID="tutorial-modal">{message}</Text> : null);
const mockWinOverlay = () => null;

jest.mock("@/components/BackButton", () => ({
  __esModule: true,
  default: mockBackButton,
}));
jest.mock("@/components/BoardGridView", () => ({
  __esModule: true,
  default: mockBoardGridViewWithLayout,
}));
jest.mock("@/components/GravityGestureLayer", () => ({
  __esModule: true,
  default: mockGravityGestureLayer,
}));
jest.mock("@/components/LoadingScreen", () => ({
  __esModule: true,
  default: mockLoadingScreen,
}));
jest.mock("@/components/PieceView", () => ({
  __esModule: true,
  default: mockPieceView,
}));
jest.mock("@/components/SlotRim", () => ({
  __esModule: true,
  default: mockSlotRim,
}));
jest.mock("@/components/TeamWellGrid", () => ({
  __esModule: true,
  default: mockTeamWellGrid,
}));
jest.mock("@/components/tutorial/TutorialStepBanner", () => ({
  __esModule: true,
  default: mockTutorialStepBanner,
}));
jest.mock("@/components/WinOverlay", () => ({
  __esModule: true,
  default: mockWinOverlay,
}));

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <UiProvider>
        <LayoutProvider>
          <GameSessionProvider>{children}</GameSessionProvider>
        </LayoutProvider>
      </UiProvider>
    </SettingsProvider>
  );
}

describe("GamePlay tutorial step 1", () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    await AsyncStorage.clear();
    mockParams.scenario = "tutorialStep1";
    mockParams.tutorialStep = "1";
    mockReplace.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders only the focus piece while the first instruction modal is visible", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const GamePlay = require("../gamePlay").default;
    const { getAllByTestId, getByTestId, queryByTestId } = render(
      <Providers>
        <GamePlay />
      </Providers>,
    );

    await waitFor(() => {
      const pieces = getAllByTestId("tutorial-piece");
      expect(pieces).toHaveLength(1);
      expect(pieces[0]).toHaveTextContent("0");
      expect(getByTestId("gravity-pulls")).toHaveTextContent("false");
      expect(getByTestId("pickup-locked")).toHaveTextContent("false");
    });
    expect(queryByTestId("tutorial-modal")).toBeNull();

    act(() => {
      jest.runOnlyPendingTimers();
    });
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(getByTestId("tutorial-modal")).toHaveTextContent(
        /Touch the piece/,
      );
    });
  });

  it.each(["5", "6"])(
    "unlocks gravity pulls and locks piece pickup during tutorial step %s",
    async (tutorialStep) => {
      mockParams.tutorialStep = tutorialStep;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const GamePlay = require("../gamePlay").default;
      const { getByTestId } = render(
        <Providers>
          <GamePlay />
        </Providers>,
      );

      await waitFor(() => {
        expect(getByTestId("gravity-pulls")).toHaveTextContent("true");
        expect(getByTestId("pickup-locked")).toHaveTextContent("true");
      });
    },
  );
});
