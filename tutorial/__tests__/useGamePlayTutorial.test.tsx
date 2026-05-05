import { createGame, Team } from "@/engine";
import { PieceStatus, type PieceStatusMap } from "@/types/pieceStatus";
import { render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";
import { useGamePlayTutorial } from "../useGamePlayTutorial";

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const baseGame = createGame();

function HookProbe({
  scenarioParam = "tutorialStep1",
  tutorialStepParam = "1",
  pieceStatusMap,
  gameState = {
    status: baseGame.status,
    currentTeam: baseGame.currentTeam,
    board: baseGame.board,
    turnCount: baseGame.turnCount,
    winner: baseGame.winner,
  },
  applyTutorialStepTwoWells = jest.fn(),
  installTutorialNearWinBoard = jest.fn(),
  installtutorialGravityNearWinBoard = jest.fn(),
  installTutorialTightSpotBoard = jest.fn(),
  finishTutorialAndPlay = jest.fn(async () => {}),
  setSlotDropHintActive = jest.fn(),
  setTutorialWellPieceIdlePulseActive = jest.fn(),
}: {
  scenarioParam?: string;
  tutorialStepParam?: string;
  pieceStatusMap: PieceStatusMap;
  gameState?: {
    status: "playing" | "finished";
    currentTeam: Team;
    board: Record<string, string>;
    turnCount: number;
    winner: Team | null;
  };
  applyTutorialStepTwoWells?: () => void;
  installTutorialNearWinBoard?: () => void;
  installtutorialGravityNearWinBoard?: () => void;
  installTutorialTightSpotBoard?: () => void;
  finishTutorialAndPlay?: () => Promise<void>;
  setSlotDropHintActive?: (active: boolean) => void;
  setTutorialWellPieceIdlePulseActive?: (active: boolean) => void;
}) {
  const result = useGamePlayTutorial({
    scenarioParam,
    tutorialStepParam,
    pieceStatusMap,
    gameStateForTutorialBanner: gameState,
    applyTutorialStepTwoWells,
    installTutorialNearWinBoard,
    installtutorialGravityNearWinBoard,
    installTutorialTightSpotBoard,
    finishTutorialAndPlay,
    setSlotDropHintActive,
    setTutorialWellPieceIdlePulseActive,
  });
  return (
    <>
      <Text testID="show">{String(result.showBanner)}</Text>
      <Text testID="message">{result.bannerMessage}</Text>
      <Text testID="resolved">{result.resolvedTutorialStepParam}</Text>
    </>
  );
}

describe("useGamePlayTutorial", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("runs the step 1 in-place handoff after the focus piece reaches the board", async () => {
    const applyTutorialStepTwoWells = jest.fn();
    const setSlotDropHintActive = jest.fn();
    const setTutorialWellPieceIdlePulseActive = jest.fn();
    const { getByTestId, rerender } = render(
      <HookProbe
        pieceStatusMap={{ "0": PieceStatus.inWell }}
        applyTutorialStepTwoWells={applyTutorialStepTwoWells}
        setSlotDropHintActive={setSlotDropHintActive}
        setTutorialWellPieceIdlePulseActive={setTutorialWellPieceIdlePulseActive}
      />,
    );

    expect(getByTestId("resolved")).toHaveTextContent("1");
    expect(getByTestId("show")).toHaveTextContent("true");
    await waitFor(() => {
      expect(setTutorialWellPieceIdlePulseActive).toHaveBeenLastCalledWith(true);
    });

    rerender(
      <HookProbe
        pieceStatusMap={{ "0": PieceStatus.onBoard }}
        applyTutorialStepTwoWells={applyTutorialStepTwoWells}
        setSlotDropHintActive={setSlotDropHintActive}
        setTutorialWellPieceIdlePulseActive={setTutorialWellPieceIdlePulseActive}
      />,
    );

    await waitFor(() => {
      expect(applyTutorialStepTwoWells).toHaveBeenCalledTimes(1);
      expect(getByTestId("resolved")).toHaveTextContent("2");
    });
  });

  it("advances tutorial scenario routes when a non-step1 scenario completes", async () => {
    const { rerender } = render(
      <HookProbe
        scenarioParam="tutorialStep2"
        tutorialStepParam="2"
        pieceStatusMap={{
          "0": PieceStatus.onBoard,
          "1": PieceStatus.onBoard,
        }}
      />,
    );

    expect(mockReplace).not.toHaveBeenCalled();

    rerender(
      <HookProbe
        scenarioParam="tutorialStep2"
        tutorialStepParam="2"
        pieceStatusMap={{
          "0": PieceStatus.onBoard,
          "1": PieceStatus.onBoard,
          "24": PieceStatus.onBoard,
        }}
      />,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        "/gamePlay?scenario=tutorialStep2&tutorialStep=3",
      );
    });
  });

  it("shows the gravity lesson banner only when its board context is ready", () => {
    const { getByTestId } = render(
      <HookProbe
        scenarioParam="tutorialStep1"
        tutorialStepParam="5"
        pieceStatusMap={{ "0": PieceStatus.onBoard }}
        gameState={{
          status: "playing",
          currentTeam: Team.One,
          board: { "7-3": "0" },
          turnCount: 10,
          winner: null,
        }}
      />,
    );

    expect(getByTestId("resolved")).toHaveTextContent("5");
    expect(getByTestId("show")).toHaveTextContent("true");
    expect(getByTestId("message")).toHaveTextContent(/shift gravity/);
  });
});
