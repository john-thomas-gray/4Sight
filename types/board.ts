export type CellProps = {
  id: string;
  type: CellType;
  team: Team;
  layout: CellLayout;
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
  Both = "both",
  Unassigned = "unassigned",
}

export enum PieceState {
  inWell = "inWell",
  onBoard = "onBoard",
  isHeld = "isHeld",
  partial = "partial",
  winner = "winner",
}

export type PieceProps = {
  team: Team;
  id: string;
  initialPosition: { x: number; y: number };
  pieceState: PieceState;
};
