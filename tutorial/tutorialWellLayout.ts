import { buildInitialWellPieceLocations } from "@/constants/wells";
import { PIECES_PER_TEAM } from "@/engine";
import { PieceStatus, type PieceStatusMap } from "@/types/pieceStatus";
import { TUTORIAL_STEP_ONE_SOURCE_WELL_CELL_ID } from "./constants";

function wellKeyForPieceId(
  wells: Readonly<Record<string, string>>,
  pieceId: string,
): string | undefined {
  const found = Object.entries(wells).find(([, pid]) => pid === pieceId);
  return found?.[0];
}

/**
 * Default well grid with exactly one empty cell: the tutorial spare slot
 * (`12-10`). Piece `0` sits on the board; the piece that normally occupies the
 * hole is moved into piece `0`'s default well cell (top-left team-one well) so
 * that slot is not left empty.
 */
export function buildTutorialStepTwoWellPieceLocations(
  board: Readonly<Record<string, string>>,
): Record<string, string> {
  const wells: Record<string, string> = {
    ...buildInitialWellPieceLocations(),
  };

  const hole = TUTORIAL_STEP_ONE_SOURCE_WELL_CELL_ID;
  const evictedFromHole = wells[hole];
  delete wells[hole];

  const pieceZeroDefaultKey = wellKeyForPieceId(wells, "0");
  if (pieceZeroDefaultKey) {
    delete wells[pieceZeroDefaultKey];
  }
  if (evictedFromHole !== undefined && pieceZeroDefaultKey) {
    wells[pieceZeroDefaultKey] = evictedFromHole;
  }

  const onBoard = new Set(Object.values(board));
  for (const [wellId, pid] of Object.entries(wells)) {
    if (onBoard.has(pid)) {
      delete wells[wellId];
    }
  }
  return wells;
}

export function pieceStatusMapForBoardAndWells(
  board: Readonly<Record<string, string>>,
  wells: Readonly<Record<string, string>>,
): PieceStatusMap {
  const onBoard = new Set(Object.values(board));
  const inWell = new Set(Object.values(wells));
  const map: PieceStatusMap = {};
  for (let i = 0; i < PIECES_PER_TEAM * 2; i++) {
    const id = String(i);
    if (onBoard.has(id)) {
      map[id] = PieceStatus.onBoard;
    } else if (inWell.has(id)) {
      map[id] = PieceStatus.inWell;
    } else {
      map[id] = PieceStatus.inWell;
    }
  }
  return map;
}
