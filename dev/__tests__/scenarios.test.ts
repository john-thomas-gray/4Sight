import {
  BOARD_SIZE,
  Coord,
  Direction,
  PIECES_PER_TEAM,
  Team,
  coordToKey,
  createGame,
  detectWin,
  isPlayable,
  placePiece,
  shiftGravity,
} from "@/engine";
import { buildInitialWellPieceLocations } from "@/constants/wells";
import { getScenario, getScenarioDelay, scenarios } from "../scenarios";

function allSlotCoords(): Coord[] {
  const slots: Coord[] = [];
  for (let i = 1; i <= BOARD_SIZE; i++) {
    slots.push({ row: 0, col: i });
    slots.push({ row: BOARD_SIZE + 1, col: i });
    slots.push({ row: i, col: 0 });
    slots.push({ row: i, col: BOARD_SIZE + 1 });
  }
  return slots;
}

function orientationForLine(coords: readonly Coord[]) {
  const [first] = coords;
  if (!first) return "unknown";
  if (coords.every((coord) => coord.row === first.row)) return "horizontal";
  if (coords.every((coord) => coord.col === first.col)) return "vertical";
  return "diagonal";
}

function nextPieceIdForTeam(board: Record<string, string>, team: Team) {
  const occupied = new Set(Object.values(board).map(Number));
  const start = team === Team.One ? 0 : PIECES_PER_TEAM;
  const end = team === Team.One ? PIECES_PER_TEAM : PIECES_PER_TEAM * 2;
  for (let id = start; id < end; id++) {
    if (!occupied.has(id)) return String(id);
  }
  throw new Error(`No spare piece remains for ${team}`);
}

function winningDropsForTeam(board: Record<string, string>, team: Team) {
  const base = createGame();
  const pieceId = nextPieceIdForTeam(board, team);
  return allSlotCoords().flatMap((slot) => {
    const result = placePiece(
      {
        ...base,
        board,
        currentTeam: team,
      },
      slot,
      pieceId,
    );
    const placed = result.events.find((event) => event.type === "piece_placed");
    const won = result.events.find((event) => event.type === "game_won");
    if (!placed || !won || won.team !== team) return [];
    return [
      {
        landingKey: coordToKey(placed.coord),
        orientation: orientationForLine(won.lines[0]?.coords ?? []),
      },
    ];
  });
}

function allOccupiedChainsTouchAnEdge(board: Record<string, string>) {
  const occupied = new Set(Object.keys(board));
  const seen = new Set<string>();

  for (const start of occupied) {
    if (seen.has(start)) continue;

    const stack = [start];
    seen.add(start);
    let touchesEdge = false;

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;

      const [row, col] = current.split("-").map(Number);
      if (
        row === 1 ||
        row === BOARD_SIZE ||
        col === 1 ||
        col === BOARD_SIZE
      ) {
        touchesEdge = true;
      }

      for (const [rowDelta, colDelta] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const neighbor = coordToKey({
          row: row + rowDelta,
          col: col + colDelta,
        });
        if (occupied.has(neighbor) && !seen.has(neighbor)) {
          seen.add(neighbor);
          stack.push(neighbor);
        }
      }
    }

    if (!touchesEdge) return false;
  }

  return true;
}

describe("dev scenarios", () => {
  it("exposes named scenarios with valid teams and fallback delays", () => {
    expect(getScenario("nearWin")).toBe(scenarios.nearWin);
    expect(getScenario("missing")).toBeUndefined();
    expect(getScenarioDelay(scenarios.nearWin)).toBe(1500);
    expect(getScenarioDelay(scenarios.tutorialStep1)).toBe(1200);
    expect(
      Object.values(scenarios).every(
        (scenario) =>
          scenario.currentTeam === Team.One || scenario.currentTeam === Team.Two,
      ),
    ).toBe(true);
  });

  it("keeps scenario boards, moves, and pieces inside the playable game model", () => {
    const allPieceIds = new Set(
      Array.from({ length: PIECES_PER_TEAM * 2 }, (_, i) => String(i)),
    );

    for (const [name, scenario] of Object.entries(scenarios)) {
      const occupied = new Set<string>();

      for (const [key, pieceId] of Object.entries(scenario.board)) {
        const [row, col] = key.split("-").map(Number);
        expect(isPlayable({ row, col })).toBe(true);
        expect(allPieceIds.has(pieceId)).toBe(true);
        expect(occupied.has(pieceId)).toBe(false);
        occupied.add(pieceId);
      }

      for (const move of scenario.moves) {
        if (move.type === "gravity") {
          expect(Object.values(Direction)).toContain(move.direction);
          continue;
        }
        expect(isPlayable(move.targetSpace)).toBe(true);
        expect(allPieceIds.has(move.pieceId)).toBe(true);
        expect(occupied.has(move.pieceId)).toBe(false);
      }

      expect(Object.keys(scenario.board).every((key) => key.includes("-")))
        .toBe(true);
      expect(name.length).toBeGreaterThan(0);
    }
  });

  it("keeps tutorial well overrides consistent with board occupancy", () => {
    const defaultWellIds = new Set(Object.keys(buildInitialWellPieceLocations()));

    for (const scenario of Object.values(scenarios)) {
      if (!scenario.wellPieceLocations) continue;
      const boardPieceIds = new Set(Object.values(scenario.board));
      for (const [wellId, pieceId] of Object.entries(
        scenario.wellPieceLocations,
      )) {
        expect(defaultWellIds.has(wellId)).toBe(true);
        expect(boardPieceIds.has(pieceId)).toBe(false);
      }
    }
  });

  it("keeps every preset board achievable from an edge-connected position", () => {
    for (const [name, scenario] of Object.entries(scenarios)) {
      expect(allOccupiedChainsTouchAnEdge(scenario.board)).toBe(true);
      expect(name.length).toBeGreaterThan(0);
    }
  });

  it("sets the tutorial win lesson up with one legal horizontal, vertical, and diagonal choice", () => {
    const scenario = scenarios.tutorialNearWin;
    const base = createGame();
    const boardPieceIds = Object.values(scenario.board);
    const teamOneCount = boardPieceIds.filter(
      (pieceId) => Number(pieceId) < PIECES_PER_TEAM,
    ).length;
    const teamTwoCount = boardPieceIds.length - teamOneCount;
    const nextPieceId = String(teamOneCount);

    expect(scenario.currentTeam).toBe(Team.One);
    expect(teamOneCount).toBe(teamTwoCount);
    expect(boardPieceIds).not.toContain(nextPieceId);
    expect(detectWin(scenario.board, base.pieces)).toMatchObject({
      winner: null,
      tie: false,
    });

    const winningDrops = allSlotCoords().flatMap((slot) => {
      const result = placePiece(
        {
          ...base,
          board: scenario.board,
          currentTeam: scenario.currentTeam,
        },
        slot,
        nextPieceId,
      );
      const placed = result.events.find((event) => event.type === "piece_placed");
      const won = result.events.find((event) => event.type === "game_won");
      if (!placed || !won || won.team !== Team.One) return [];
      return [
        {
          landingKey: coordToKey(placed.coord),
          orientation: orientationForLine(won.lines[0]?.coords ?? []),
        },
      ];
    });

    expect(winningDrops).toEqual([
      { landingKey: "7-1", orientation: "vertical" },
      { landingKey: "5-7", orientation: "diagonal" },
      { landingKey: "7-7", orientation: "horizontal" },
    ]);
  });

  it("sets the defensive gravity lesson up with two black drop wins that any pull defuses", () => {
    const scenario = scenarios.tutorialTightSpot;
    const base = createGame();
    const boardPieceIds = Object.values(scenario.board);
    const teamOneCount = boardPieceIds.filter(
      (pieceId) => Number(pieceId) < PIECES_PER_TEAM,
    ).length;
    const teamTwoCount = boardPieceIds.length - teamOneCount;

    expect(scenario.currentTeam).toBe(Team.One);
    expect(teamOneCount).toBe(teamTwoCount);
    expect(allOccupiedChainsTouchAnEdge(scenario.board)).toBe(true);
    expect(detectWin(scenario.board, base.pieces)).toMatchObject({
      winner: null,
      tie: false,
    });
    expect(winningDropsForTeam(scenario.board, Team.Two)).toEqual([
      { landingKey: "7-3", orientation: "diagonal" },
      { landingKey: "3-7", orientation: "diagonal" },
    ]);

    for (const direction of Object.values(Direction)) {
      const defended = shiftGravity(
        {
          ...base,
          board: scenario.board,
          currentTeam: Team.One,
        },
        direction,
      );

      expect(defended.state).toMatchObject({
        winner: null,
        tie: false,
        status: "playing",
      });
      expect(winningDropsForTeam(defended.state.board, Team.Two)).toEqual([]);

      for (const blackDirection of Object.values(Direction)) {
        const blackPull = shiftGravity(
          {
            ...base,
            board: defended.state.board,
            currentTeam: Team.Two,
          },
          blackDirection,
        );
        expect(blackPull.state).toMatchObject({
          winner: null,
          tie: false,
          status: "playing",
        });
      }
    }
  });

  it("uses a 7x7 engine board while the UI frame surrounds it with slots", () => {
    expect(coordToKey({ row: BOARD_SIZE, col: BOARD_SIZE })).toBe("7-7");
  });
});
