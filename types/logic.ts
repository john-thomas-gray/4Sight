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
export enum Winner {
  TeamOne = Team.TeamOne,
  TeamTwo = Team.TeamTwo,
  Tie = "tie",
  Null = "",
}
export enum GameState {
  PreGame = "preGame",
  Loading = "loading",
  Ready = "ready",
  Playing = "playing",
  Finished = "finished",
}
