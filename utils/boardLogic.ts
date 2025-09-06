import { Board, Utils } from "@/types";
import { Team } from "@/types/board";

type GetCellListProps = {
  layout: Utils.LayoutCells;
  result: "wells" | "spaces" | "slots" | "all";
  team: Team;
};

export const getCellArray = ({ layout, result, team }: GetCellListProps) => {
  const wellArray = Object.entries(layout.wells[team]).map(([id, cell]) => ({
    id,
    ...cell,
    type: Board.CellType.Well as const,
    team,
  }));

  if (result === "wells") return wellArray;

  const slotArray = Object.entries(layout.slots).map(([id, cell]) => ({
    id,
    ...cell,
    type: Board.CellType.Slot as const,
  }));

  if (result === "slots") return slotArray;

  const spaceArray = Object.entries(layout.spaces).map(([id, cell]) => ({
    id,
    ...cell,
    type: Board.CellType.Space as const,
  }));

  if (result === "spaces") return spaceArray;

  const allCells: Board.CellLayout[] = [
    ...wellArray,
    ...slotArray,
    ...spaceArray,
  ];

  if (result === "all") return allCells;

  return [];
};
