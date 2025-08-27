import { Winner } from "./logic";

export type CellProps = {
  id: string;
  type: CellType;
  team?: Team;
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

export enum Direction {
  Up = "up",
  Down = "down",
  Left = "left",
  Right = "right",
}

export type Team = Winner.TeamOne | Winner.TeamTwo;

export type WellState = {
  [Winner.TeamOne]: Record<string, CellLayout>;
  [Winner.TeamTwo]: Record<string, CellLayout>;
};
