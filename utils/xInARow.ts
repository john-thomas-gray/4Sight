import { Team } from "@/types/board";
import { Winner } from "@/types/logic";

type Board = Record<string, string>;

export const xInARow = (
  board: Board,
  X: number,
  rows = 9,
  cols = 9
): Winner => {
  const getTeam = (r: number, c: number) => {
    const piece = board[`${r}-${c}`];
    if (!piece) return null;
    return Number(piece) < 24 ? Winner.TeamOne : Winner.TeamTwo;
  };

  const directions = [
    [0, 1], // horizontal right
    [1, 0], // vertical down
    [1, 1], // diagonal down-right
    [-1, 1], // diagonal up-right
  ];

  const winners = new Set<Team>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const team = getTeam(r, c);
      if (!team) continue;

      for (const [dr, dc] of directions) {
        let count = 1;
        for (let i = 1; i < X; i++) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) break;
          if (getTeam(nr, nc) !== team) break;
          count++;
        }
        if (count === X) {
          winners.add(team);
        }
      }
    }
  }

  if (winners.size === 2) return Winner.Tie;
  if (winners.size === 1) return Array.from(winners)[0];
  return Winner.Null;
};
