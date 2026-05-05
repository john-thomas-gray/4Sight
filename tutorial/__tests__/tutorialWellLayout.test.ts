import { buildInitialWellPieceLocations } from "@/constants/wells";
import { PIECES_PER_TEAM } from "@/engine";
import { PieceStatus } from "@/types/pieceStatus";
import { TUTORIAL_STEP_ONE_SOURCE_WELL_CELL_ID } from "@/tutorial/constants";
import {
  buildTutorialStepTwoWellPieceLocations,
  pieceStatusMapForBoardAndWells,
} from "@/tutorial/tutorialWellLayout";

describe("buildTutorialStepTwoWellPieceLocations", () => {
  it("starts the tutorial with piece 0 in the center of player one's well", () => {
    expect(TUTORIAL_STEP_ONE_SOURCE_WELL_CELL_ID).toBe("12-10");
  });

  it("keeps exactly one empty well (the tutorial hole) when piece 0 is on the board", () => {
    const board = { "4-4": "0" };
    const wells = buildTutorialStepTwoWellPieceLocations(board);
    const fullCount = Object.keys(buildInitialWellPieceLocations()).length;

    expect(Object.keys(wells)).toHaveLength(fullCount - 1);
    expect(wells[TUTORIAL_STEP_ONE_SOURCE_WELL_CELL_ID]).toBeUndefined();
    expect(Object.values(wells)).not.toContain("0");

    const defaultZeroCell = wellKeyForPiece0Default();
    expect(wells[defaultZeroCell]).toBeDefined();
    expect(Object.values(wells).filter((id) => id === "0").length).toBe(0);
  });

  it("assigns every other piece id to a well", () => {
    const board = { "4-4": "0" };
    const wells = buildTutorialStepTwoWellPieceLocations(board);
    const inWell = new Set(Object.values(wells));
    for (let i = 1; i < PIECES_PER_TEAM * 2; i++) {
      expect(inWell.has(String(i))).toBe(true);
    }
  });

  it("matches pieceStatusMapForBoardAndWells invariants", () => {
    const board = { "4-4": "0" };
    const wells = buildTutorialStepTwoWellPieceLocations(board);
    const map = pieceStatusMapForBoardAndWells(board, wells);
    expect(map["0"]).toBe(PieceStatus.onBoard);
    for (let i = 1; i < PIECES_PER_TEAM * 2; i++) {
      expect(map[String(i)]).toBe(PieceStatus.inWell);
    }
  });
});

function wellKeyForPiece0Default(): string {
  const full = buildInitialWellPieceLocations();
  const e = Object.entries(full).find(([, pid]) => pid === "0");
  if (!e) throw new Error("expected default map to place piece 0");
  return e[0];
}
