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

export type Team = "teamOne" | "teamTwo";

export type WellState = {
  teamOne: Record<string, CellLayout>;
  teamTwo: Record<string, CellLayout>;
};
