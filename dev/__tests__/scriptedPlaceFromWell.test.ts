import { TURN_CHANGE_COMMIT_DELAY_MS } from "@/constants/logic";
import { Direction, type EngineResult, type GameState, Team } from "@/engine";
import type { PieceAnimation } from "@/types/animation";
import { PieceStatus, type PieceStatusMap } from "@/types/pieceStatus";
import { runScriptedPlaceFromWell } from "../scriptedPlaceFromWell";

function anim(): PieceAnimation {
  return {
    translateX: { value: 0 } as never,
    translateY: { value: 0 } as never,
    scaleX: { value: 1.1 } as never,
    scaleY: { value: 1.1 } as never,
    color: { value: "#fff" } as never,
    winnerColor: { value: "#ffd" } as never,
    zIndex: { value: 500 } as never,
  };
}

describe("runScriptedPlaceFromWell", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("moves a scripted well piece through a slot and commits the drop", () => {
    let wells: Record<string, string> = { "12-10": "0", "12-11": "1" };
    let statuses: PieceStatusMap = {
      "0": PieceStatus.inWell,
      "1": PieceStatus.inWell,
    };
    let moveInProgress = false;
    const dropPiece = jest.fn(
      (): EngineResult => ({
        state: {} as GameState,
        events: [],
      }),
    );

    const didQueue = runScriptedPlaceFromWell({
      board: {},
      slotCoord: { row: 0, col: 4 },
      pieceId: "0",
      layout: {
        slots: { "0-4": { pageX: 0, pageY: 0, width: 40, height: 40 } },
        spaces: { "7-4": { pageX: 0, pageY: 280, width: 40, height: 40 } },
      },
      pieceAnims: { "0": anim() },
      setWellPieceLocations: (update) => {
        wells = typeof update === "function" ? update(wells) : update;
      },
      setPieceStatusMap: (update) => {
        statuses = typeof update === "function" ? update(statuses) : update;
      },
      setMoveInProgress: (value) => {
        moveInProgress =
          typeof value === "function" ? value(moveInProgress) : value;
      },
      setMoveInProgressDelayed: jest.fn(),
      dropPiece,
    });

    expect(didQueue).toBe(true);
    expect(wells).toEqual({ "12-11": "1" });
    expect(statuses["0"]).toBe(PieceStatus.isHeld);
    expect(moveInProgress).toBe(true);

    jest.advanceTimersByTime(TURN_CHANGE_COMMIT_DELAY_MS);

    expect(dropPiece).toHaveBeenCalledWith({ row: 0, col: 4 }, "0");
    expect(statuses["0"]).toBe(PieceStatus.onBoard);
  });

  it("returns false when the scripted drop cannot resolve", () => {
    const didQueue = runScriptedPlaceFromWell({
      board: { "1-4": "24" },
      slotCoord: { row: 0, col: 4 },
      pieceId: "0",
      layout: {
        slots: { "0-4": { pageX: 0, pageY: 0, width: 40, height: 40 } },
        spaces: {},
      },
      pieceAnims: { "0": anim() },
      setWellPieceLocations: jest.fn(),
      setPieceStatusMap: jest.fn(),
      setMoveInProgress: jest.fn(),
      setMoveInProgressDelayed: jest.fn(),
      dropPiece: jest.fn(),
    });

    expect(didQueue).toBe(false);
  });

  it("accepts every gravity direction type used by scripted playback", () => {
    expect(Object.values(Direction)).toEqual([
      Direction.Up,
      Direction.Down,
      Direction.Left,
      Direction.Right,
    ]);
    expect(Team.One).toBe("teamOne");
    expect(Team.Two).toBe("teamTwo");
  });
});
