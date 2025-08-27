import { CellProps, CellType } from "@/types/board";
import { Winner } from "@/types/logic";

export const getCellData = (id: string) => {
  const [row, col] = id.split("-").map(Number) as [number, number];

  let type: CellProps["type"] = CellType.Error;
  let team: CellProps["team"];
  let direction: string = "";

  const cornerRows = [0, 8];
  const cornerCols = [0, 8];

  if (cornerRows.includes(row) && cornerCols.includes(col)) {
    type = CellType.Corner;
  } else if (row > 0 && row < 8 && col > 0 && col < 8) {
    type = CellType.Space;
  } else if (row === 0 || row === 8 || col === 0 || col === 8) {
    type = CellType.Slot;
    if (row === 0) {
      direction = "N";
    } else if (row === 8) {
      direction = "S";
    } else if (col === 0) {
      direction = "W";
    } else if (col === 8) {
      direction = "E";
    }
  } else if (row > 8 && col > 8) {
    type = CellType.Well;
    if (row > 16 && col > 11) {
      team = Winner.TeamTwo;
    } else {
      team = Winner.TeamOne;
    }
  } else {
    throw new Error(
      `Cell data could not be found for cell with coordinates [${row}, ${col}]`
    );
  }

  return { type: type, team: team, direction: direction };
};
