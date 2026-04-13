import {
  createGame,
  createPieces,
  Team,
  PIECES_PER_TEAM,
} from "../index";
import { buildInitialWellPieceLocations } from "@/constants/wells";

// Well IDs that TeamWellGrid generates for each team
function getTeamOneWellIds(): string[] {
  const ids: string[] = [];
  const rowOffset = 9;
  const columnOffset = 9;
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 8; row++) {
      ids.push(`${row + rowOffset}-${col + columnOffset}`);
    }
  }
  return ids;
}

function getTeamTwoWellIds(): string[] {
  const ids: string[] = [];
  const rowOffset = 17;
  const columnOffset = 12;
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 8; row++) {
      ids.push(`${row + rowOffset}-${col + columnOffset}`);
    }
  }
  return ids;
}

describe("initial game state - pieces in wells", () => {
  const wellPieceLocations = buildInitialWellPieceLocations();
  const pieces = createPieces();

  it("creates exactly 48 pieces (24 per team)", () => {
    const allPieces = Object.values(pieces);
    expect(allPieces).toHaveLength(PIECES_PER_TEAM * 2);

    const t1 = allPieces.filter((p) => p.team === Team.One);
    const t2 = allPieces.filter((p) => p.team === Team.Two);
    expect(t1).toHaveLength(PIECES_PER_TEAM);
    expect(t2).toHaveLength(PIECES_PER_TEAM);
  });

  it("creates exactly 48 well-piece mappings", () => {
    expect(Object.keys(wellPieceLocations)).toHaveLength(PIECES_PER_TEAM * 2);
  });

  it("every piece ID in wells is a valid piece", () => {
    for (const pieceId of Object.values(wellPieceLocations)) {
      expect(pieces[pieceId]).toBeDefined();
    }
  });

  it("every piece is assigned to exactly one well", () => {
    const assignedPieceIds = Object.values(wellPieceLocations);
    const uniqueIds = new Set(assignedPieceIds);
    expect(uniqueIds.size).toBe(assignedPieceIds.length);
  });

  it("Team One pieces (0-23) map to Team One wells", () => {
    const t1WellIds = new Set(getTeamOneWellIds());
    for (const [wellId, pieceId] of Object.entries(wellPieceLocations)) {
      const piece = pieces[pieceId];
      if (piece.team === Team.One) {
        expect(t1WellIds.has(wellId)).toBe(true);
      }
    }
  });

  it("Team Two pieces (24-47) map to Team Two wells", () => {
    const t2WellIds = new Set(getTeamTwoWellIds());
    for (const [wellId, pieceId] of Object.entries(wellPieceLocations)) {
      const piece = pieces[pieceId];
      if (piece.team === Team.Two) {
        expect(t2WellIds.has(wellId)).toBe(true);
      }
    }
  });

  it("Team One well IDs from grid match piece location keys", () => {
    const gridWellIds = getTeamOneWellIds();
    const pieceWellIds = Object.keys(wellPieceLocations).filter((wid) => {
      const pieceId = wellPieceLocations[wid];
      return pieces[pieceId].team === Team.One;
    });
    expect(new Set(pieceWellIds)).toEqual(new Set(gridWellIds));
  });

  it("Team Two well IDs from grid match piece location keys", () => {
    const gridWellIds = getTeamTwoWellIds();
    const pieceWellIds = Object.keys(wellPieceLocations).filter((wid) => {
      const pieceId = wellPieceLocations[wid];
      return pieces[pieceId].team === Team.Two;
    });
    expect(new Set(pieceWellIds)).toEqual(new Set(gridWellIds));
  });

  it("createGame starts with an empty board", () => {
    const state = createGame();
    expect(Object.keys(state.board)).toHaveLength(0);
  });

  it("createGame pieces match createPieces", () => {
    const state = createGame();
    expect(Object.keys(state.pieces)).toHaveLength(PIECES_PER_TEAM * 2);
    for (const [id, piece] of Object.entries(state.pieces)) {
      expect(piece.id).toBe(id);
      expect([Team.One, Team.Two]).toContain(piece.team);
    }
  });
});
