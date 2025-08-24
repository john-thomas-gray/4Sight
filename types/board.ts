import { Team } from "./logic";

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

export type CellType = "space" | "slot" | "well" | "corner" | "error";

export type PullDirection = "up" | "down" | "left" | "right";
