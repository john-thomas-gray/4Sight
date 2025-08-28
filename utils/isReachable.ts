import { BOARD_SIZE_ZERO_IDX } from "@/constants/gameElements";
import { Direction } from "@/types/board";

const isReachable = (board: Record<string, string>, targetCell: string) => {
  const [rowStr, colStr] = targetCell.split("-");
  const row = Number(rowStr);
  const col = Number(colStr);

  // Distance to the edge (slot) in each direction
  const DistanceToSlot: Record<Direction, number> = {
    [Direction.Up]: row,
    [Direction.Down]: BOARD_SIZE_ZERO_IDX - row,
    [Direction.Right]: BOARD_SIZE_ZERO_IDX - col,
    [Direction.Left]: col,
  };

  const checkCell = (r: number, c: number) => {
    const piece = board[`${r}-${c}`];
    return piece ? "occupied" : "empty";
  };

  const DirectionVectors: Record<Direction, [number, number]> = {
    [Direction.Up]: [-1, 0],
    [Direction.Down]: [1, 0],
    [Direction.Right]: [0, 1],
    [Direction.Left]: [0, -1],
  };

  if (checkCell(row, col) === "occupied") return false;

  for (const dir of Object.values(Direction)) {
    const [dRow, dCol] = DirectionVectors[dir];
    const distance = DistanceToSlot[dir];

    for (let i = 1; i <= distance; i++) {
      const r = row + dRow * i;
      const c = col + dCol * i;

      if (checkCell(r, c) === "occupied") {
        break;
      }

      if (i === distance) return true;
    }
  }

  return false;
};

export default isReachable;
