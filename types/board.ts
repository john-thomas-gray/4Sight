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

export enum Team {
  TeamOne = "teamOne",
  TeamTwo = "teamTwo",
  Unassigned = "unassigned",
}

export type WellState = {
  [Team.TeamOne]: Record<string, CellLayout>;
  [Team.TeamTwo]: Record<string, CellLayout>;
};

export type PieceProps = {
  team: Team;
  id: string;
  initialPosition: { x: number; y: number };
  currentWellId?: string;
};

export enum HighlightProps {
  Off = "off",
  Almost = "almost",
  Winner = "winner",
}
