import { Board, Utils } from "@/types";
import { EachCellType, Team } from "@/types/board";

type GetCellArrayProps = {
  layout: Utils.LayoutCells;
  result: "wells" | "spaces" | "slots" | "all";
  team: Team;
};

export const getCellArray = ({
  layout,
  result,
  team,
}: GetCellArrayProps): EachCellType[] => {
  const wellArray = Object.entries(layout.wells[team]).map(([id, layout]) => ({
    id,
    layout,
    type: Board.CellType.Well as const,
    team,
  }));

  const slotArray = Object.entries(layout.slots).map(([id, layout]) => ({
    id,
    layout,
    type: Board.CellType.Slot as const,
  }));

  const spaceArray = Object.entries(layout.spaces).map(([id, layout]) => ({
    id,
    layout,
    type: Board.CellType.Space as const,
  }));



  const allCells: EachCellType[] = [...wellArray, ...slotArray, ...spaceArray];

  switch(result){
    case "wells": return wellArray;
    case "slots": return slotArray;
    case "spaces": return spaceArray;
    case "all": return allCells;
    default: return [];
  }

};
