import AsyncStorage from "@react-native-async-storage/async-storage";
import { buildInitialWellPieceLocations } from "@/constants/wells";
import { scenarios } from "@/dev/scenarios";
import { createGame, Direction, Team } from "@/engine";
import { gameStateToSerializable, loadAppState } from "@/storage";
import { PieceStatus, type PieceStatusMap } from "@/types/pieceStatus";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Pressable, Text } from "react-native";
import { GameSessionProvider, useGameSession } from "../GameSessionContext";
import { LayoutProvider } from "../LayoutContext";
import { SettingsProvider } from "../SettingsContext";
import { UiProvider } from "../UiContext";

const continuedPieceStatusMap: PieceStatusMap = {
  "0": PieceStatus.onBoard,
  "1": PieceStatus.inWell,
};

const continuedSession = {
  game: gameStateToSerializable({
    ...createGame(),
    board: { "7-4": "0" },
    currentTeam: Team.Two,
    turnCount: 3,
  }),
  pieceStatusMap: continuedPieceStatusMap,
  wellPieceLocations: {
    ...buildInitialWellPieceLocations(),
    "12-10": undefined as never,
  },
};
delete continuedSession.wellPieceLocations["12-10"];

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

function SessionProbe() {
  const session = useGameSession();
  const [lastEvents, setLastEvents] = React.useState("");
  const [loadedMoveCount, setLoadedMoveCount] = React.useState(0);
  const boardKeys = Object.keys(session.gameState.board).sort();
  const nextTurnWinKeys = Object.keys(session.nextTurnWins).sort();

  return (
    <>
      <Text testID="team">{session.gameState.currentTeam}</Text>
      <Text testID="turn">{String(session.gameState.turnCount)}</Text>
      <Text testID="status">{session.gameState.status}</Text>
      <Text testID="board-count">{String(boardKeys.length)}</Text>
      <Text testID="board-keys">{boardKeys.join(",")}</Text>
      <Text testID="well-count">
        {String(Object.keys(session.wellPieceLocations).length)}
      </Text>
      <Text testID="piece-0">{session.pieceStatusMap["0"]}</Text>
      <Text testID="piece-3">{session.pieceStatusMap["3"]}</Text>
      <Text testID="near-wins">{String(session.nearWins.length)}</Text>
      <Text testID="next-turn-wins">{nextTurnWinKeys.join(",")}</Text>
      <Text testID="loaded-moves">{String(loadedMoveCount)}</Text>
      <Text testID="events">{lastEvents}</Text>
      <Pressable
        testID="drop"
        onPress={() => {
          const result = session.dropPiece({ row: 0, col: 4 }, "0");
          setLastEvents(result.events.map((event) => event.type).join(","));
        }}
      >
        <Text>Drop</Text>
      </Pressable>
      <Pressable
        testID="gravity"
        onPress={() => {
          const result = session.shiftGravity(Direction.Up);
          setLastEvents(result.events.map((event) => event.type).join(","));
        }}
      >
        <Text>Gravity</Text>
      </Pressable>
      <Pressable
        testID="load-near-win"
        onPress={() => setLoadedMoveCount(session.loadScenario(scenarios.nearWin).length)}
      >
        <Text>Load near win</Text>
      </Pressable>
      <Pressable
        testID="continue"
        onPress={() => session.continueGame(continuedSession)}
      >
        <Text>Continue</Text>
      </Pressable>
      <Pressable testID="new-game" onPress={() => void session.newGame()}>
        <Text>New game</Text>
      </Pressable>
    </>
  );
}

describe("GameSessionProvider", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it("drops pieces, shifts gravity, advances turns, and persists the session", async () => {
    const { getByTestId } = render(
      <Providers>
        <SessionProbe />
      </Providers>,
    );

    expect(getByTestId("board-count")).toHaveTextContent("0");
    expect(getByTestId("well-count")).toHaveTextContent("48");

    fireEvent.press(getByTestId("drop"));
    await waitFor(() => {
      expect(getByTestId("board-keys")).toHaveTextContent("7-4");
      expect(getByTestId("turn")).toHaveTextContent("1");
      expect(getByTestId("team")).toHaveTextContent(Team.Two);
    });
    expect(getByTestId("events")).toHaveTextContent(/piece_placed/);

    fireEvent.press(getByTestId("gravity"));
    await waitFor(() => {
      expect(getByTestId("board-keys")).toHaveTextContent("1-4");
      expect(getByTestId("turn")).toHaveTextContent("2");
      expect(getByTestId("team")).toHaveTextContent(Team.One);
    });

    await waitFor(async () => {
      const state = await loadAppState();
      expect(state.session?.game.turnCount).toBe(2);
      expect(state.session?.game.board).toEqual({ "1-4": "0" });
    });
  });

  it("loads scenario boards, statuses, wells, and next-turn win previews", async () => {
    const { getByTestId } = render(
      <Providers>
        <SessionProbe />
      </Providers>,
    );

    fireEvent.press(getByTestId("load-near-win"));

    await waitFor(() => {
      expect(getByTestId("loaded-moves")).toHaveTextContent("1");
      expect(getByTestId("board-count")).toHaveTextContent("5");
      expect(getByTestId("piece-0")).toHaveTextContent(PieceStatus.onBoard);
      expect(getByTestId("piece-3")).toHaveTextContent(PieceStatus.inWell);
      expect(getByTestId("well-count")).toHaveTextContent("43");
      expect(getByTestId("near-wins")).not.toHaveTextContent("0");
      expect(getByTestId("next-turn-wins")).not.toHaveTextContent("");
    });
  });

  it("continues saved sessions and starts a fresh game", async () => {
    const { getByTestId } = render(
      <Providers>
        <SessionProbe />
      </Providers>,
    );

    fireEvent.press(getByTestId("continue"));
    await waitFor(() => {
      expect(getByTestId("board-keys")).toHaveTextContent("7-4");
      expect(getByTestId("team")).toHaveTextContent(Team.Two);
      expect(getByTestId("piece-0")).toHaveTextContent(PieceStatus.onBoard);
      expect(getByTestId("well-count")).toHaveTextContent("47");
    });

    fireEvent.press(getByTestId("new-game"));
    await waitFor(() => {
      expect(getByTestId("board-count")).toHaveTextContent("0");
      expect(getByTestId("turn")).toHaveTextContent("0");
      expect(getByTestId("well-count")).toHaveTextContent("48");
      expect(getByTestId("piece-0")).toHaveTextContent(PieceStatus.inWell);
    });
  });
});
