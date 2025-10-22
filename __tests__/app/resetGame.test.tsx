import { render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import { LogicProvider, useLogic } from "@/context/LogicContext";
import { Team } from "@/types/board";
import { GameState, PieceStatus } from "@/types/logic";

// Mock animations to avoid running real reanimated timelines during tests
jest.mock("@/animations/pieceAnimations", () => ({
  animateWinner: jest.fn(),
  resetAllPieces: jest.fn(),
}));

// Provide a lightweight mock for LayoutContext consumed by LogicProvider
// Ensure layoutReady is true and each team has 24 wells
jest.mock("@/context/LayoutContext", () => {
  const makeLayout = () => ({ pageX: 0, pageY: 0, width: 40, height: 40 });
  const wellsTeamOne: Record<string, any> = {};
  const wellsTeamTwo: Record<string, any> = {};
  // Create 24 wells per team with ids in "row-col" format
  let count = 0;
  for (let r = 1; r <= 6; r++) {
    for (let c = 1; c <= 4; c++) {
      if (count < 24) {
        wellsTeamOne[`${r}-${c}`] = makeLayout();
        wellsTeamTwo[`${r + 10}-${c + 10}`] = makeLayout();
        count++;
      }
    }
  }
  const spaces = { "1-1": makeLayout() };
  const slots = { "1-1": makeLayout() };
  const corners = { "1-1": makeLayout() };
  const layoutValue = {
    wells: {
      teamOne: wellsTeamOne,
      teamTwo: wellsTeamTwo,
      both: {},
      unassigned: {},
    },
    spaces,
    slots,
    corners,
    layoutReady: true,
    registerCell: jest.fn(),
  };
  return {
    useLayout: () => layoutValue,
    LayoutProvider: ({ children }: any) => <>{children}</>,
  };
});

// Optional: mock reanimated to stable values in Jest without using require()
jest.mock("react-native-reanimated", () => {
  const noOp = () => {};
  return {
    __esModule: true,
    useSharedValue: (initial: any) => ({ value: initial }),
    withTiming: (v: any) => v,
    withSequence: (...args: any[]) => args[args.length - 1],
    withRepeat: (v: any) => v,
    Easing: {
      inOut: () => noOp,
      out: () => noOp,
      quad: {},
    },
    cancelAnimation: noOp,
  };
});

const Harness: React.FC = () => {
  const logic = useLogic();
  const [capturedInitial, setCapturedInitial] = React.useState<null | {
    turnCount: number;
    winner: Team;
    moveInProgress: boolean;
    gameState: GameState;
    pieceStatusAllInWell: boolean;
    boardCount: number;
    wellCount: number;
  }>(null);
  const [postResetReady, setPostResetReady] = React.useState(false);

  // When pieces are built, ensure Ready state, then capture snapshot and trigger win
  React.useEffect(() => {
    const piecesBuilt = Object.keys(logic.pieces || {}).length === 48;
    if (!piecesBuilt) return;
    if (!capturedInitial && logic.gameState !== GameState.Ready) {
      logic.setGameState(GameState.Ready);
      return;
    }
    if (logic.gameState !== GameState.Ready) return;
    if (capturedInitial) return;

    const allInWell = Object.values(logic.pieceStatusMap || {}).every(
      (s) => s === PieceStatus.inWell
    );
    const initialSnap = {
      turnCount: logic.turnCount,
      winner: logic.winner,
      moveInProgress: logic.moveInProgress,
      gameState: logic.gameState,
      pieceStatusAllInWell: allInWell,
      boardCount: Object.keys(logic.boardPieceLocations || {}).length,
      wellCount: Object.keys(logic.wellPieceLocations || {}).length,
    };
    setCapturedInitial(initialSnap);

    // Create a TeamOne winning board: 4 in a row in column 1
    const winningBoard: Record<string, string> = {
      "1-1": "0",
      "1-2": "1",
      "1-3": "2",
      "1-4": "3",
    };
    logic.setBoardPieceLocations(winningBoard);
    logic.checkGameFinished(winningBoard);
  }, [
    logic,
    logic.pieces,
    logic.gameState,
    logic.turnCount,
    logic.winner,
    capturedInitial,
  ]);

  // Once winner is detected, reset the game (no forfeit)
  React.useEffect(() => {
    if (!capturedInitial) return;
    if (
      logic.winner === Team.TeamOne &&
      logic.gameState === GameState.Finished
    ) {
      logic.resetGame(1, false);
    }
  }, [logic, logic.winner, logic.gameState, capturedInitial]);

  // Mark when post-reset state is achieved
  React.useEffect(() => {
    if (!capturedInitial) return;
    const allInWell = Object.values(logic.pieceStatusMap || {}).every(
      (s) => s === PieceStatus.inWell
    );
    if (
      logic.gameState === GameState.Ready &&
      logic.winner === Team.Unassigned &&
      logic.turnCount === 0 &&
      allInWell &&
      Object.keys(logic.boardPieceLocations || {}).length === 0 &&
      Object.keys(logic.wellPieceLocations || {}).length ===
        capturedInitial.wellCount
    ) {
      setPostResetReady(true);
    }
  }, [
    logic,
    logic.gameState,
    logic.winner,
    logic.turnCount,
    logic.pieceStatusMap,
    logic.boardPieceLocations,
    logic.wellPieceLocations,
    capturedInitial,
  ]);

  return (
    <>
      <Text testID="playersTurn">{String(logic.playersTurn)}</Text>
      <Text testID="initialReady">{String(!!capturedInitial)}</Text>
      <Text testID="postResetReady">{String(postResetReady)}</Text>
      <Text testID="initialEqualsPost">
        {capturedInitial &&
        postResetReady &&
        capturedInitial.turnCount === 0 &&
        capturedInitial.winner === Team.Unassigned &&
        capturedInitial.moveInProgress === false &&
        capturedInitial.gameState === GameState.Ready &&
        capturedInitial.pieceStatusAllInWell === true &&
        capturedInitial.boardCount === 0
          ? "true"
          : "false"}
      </Text>
    </>
  );
};

describe("resetGame", () => {
  it("resets to initial game state and sets playersTurn to winning team", async () => {
    const { getByTestId } = render(
      <LogicProvider>
        <Harness />
      </LogicProvider>
    );

    // Wait for initial snapshot captured
    await waitFor(() =>
      expect(getByTestId("initialReady").props.children).toBe("true")
    );

    // Wait for post-reset state to be ready
    await waitFor(() =>
      expect(getByTestId("postResetReady").props.children).toBe("true")
    );

    // After TeamOne win, playersTurn should be 1
    expect(getByTestId("playersTurn").props.children).toBe("1");

    // Initial state snapshot equals post-reset for core fields
    expect(getByTestId("initialEqualsPost").props.children).toBe("true");
  });
});
