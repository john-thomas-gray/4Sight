import { Team as EngineTeam } from "@/engine";

export type CellProps = {
  id: string;
  type: CellType;
  team?: EngineTeam;
  layout?: CellLayout;
};

export type CellLayout = {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
};

export enum CellType {
  Space = "space",
  Slot = "slot",
  Well = "well",
  Corner = "corner",
  Error = "error",
}

export { EngineTeam as Team };

export enum Direction {
  Up = "up",
  Down = "down",
  Left = "left",
  Right = "right",
}

export type EachCellType =
  | { id: string; layout: CellLayout; type: CellType.Slot }
  | { id: string; layout: CellLayout; type: CellType.Space }
  | CellProps;
