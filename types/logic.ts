import { MASTER } from "@/constants/colorThemes";
export type Turn = 1 | 2 | 3 | 4;
export type GameMode = "twoPlayer" | "fourPlayer";

export type Team = typeof MASTER.TEAM_ONE_COLOR | typeof MASTER.TEAM_TWO_COLOR;

export const TEAM_COLORS = {
  TEAM_ONE_COLOR: MASTER.TEAM_ONE_COLOR,
  TEAM_TWO_COLOR: MASTER.TEAM_TWO_COLOR,
} as const;
