import { Team } from "./board";

export enum Turn {
  One = 1,
  Two = 2,
  Three = 3,
  Four = 4,
}
export enum GameMode {
  TwoPlayer = "twoPlayer",
  FourPlayer = "fourPlayer",
}
export enum GameState {
  PreGame = "preGame",
  Loading = "loading",
  Ready = "ready",
  Playing = "playing",
  Finished = "finished",
  PostGame = "postGame",
}

export enum PieceStatus {
  inWell = "inWell",
  onBoard = "onBoard",
  isHeld = "isHeld",
  partial = "partial",
  winner = "winner",
}

export type PieceProps = {
  team: Team;
  id: string;
};

export type PieceStatusMap = Record<string, PieceStatus>;
