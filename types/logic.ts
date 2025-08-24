import { TEAM_ONE_COLOR, TEAM_TWO_COLOR } from "@/constants/gameElements";
export type Turn = 1 | 2 | 3 | 4;
export type GameMode = "twoPlayer" | "fourPlayer";

export type Team = typeof TEAM_ONE_COLOR | typeof TEAM_TWO_COLOR;

export const TEAM_COLORS = {
  TEAM_ONE_COLOR,
  TEAM_TWO_COLOR,
} as const;
