import { TEAM_ONE_COLOR, TEAM_TWO_COLOR } from "@/constants/gameElements";
import { CellProps } from "@/types/board";

export const getCellData = (id: string) => {
  const [row, col] = id.split("-").map(Number) as [number, number];

  let type: CellProps["type"] = "error";
  let team: CellProps["team"];
  let direction: string = "";

  const cornerRows = [0, 8];
  const cornerCols = [0, 8];

  if (cornerRows.includes(row) && cornerCols.includes(col)) {
    type = "corner";
  } else if (row > 0 && row < 8 && col > 0 && col < 8) {
    type = "space";
  } else if (row === 0 || row === 8 || col === 0 || col === 8) {
    type = "slot";
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
    type = "well";
    if (row > 16 && col > 11) {
      team = TEAM_TWO_COLOR;
    } else {
      team = TEAM_ONE_COLOR;
    }
  } else {
    throw new Error(
      `Cell data could not be found for cell with coordinates [${row}, ${col}]`
    );
  }

  return { type: type, team: team, direction: direction };
};
