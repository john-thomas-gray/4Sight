import { BOARD_SIZE_ZERO_IDX } from "@/constants/gameElements";

const getReachableSlot = (
  board: Record<string, string>,
  targetCell: string
) => {
  ("worklet");

  const [row, col] = targetCell.split("-").map(Number);

  const distanceToSlot: Record<string, number> = {
    Up: row,
    Down: BOARD_SIZE_ZERO_IDX - row,
    Right: BOARD_SIZE_ZERO_IDX - col,
    Left: col,
  };

  const directionVectors: Record<string, [number, number]> = {
    Up: [-1, 0],
    Down: [1, 0],
    Right: [0, 1],
    Left: [0, -1],
  };

  const direction: Record<string, string> = {
    Up: "Up",
    Down: "Down",
    Right: "Right",
    Left: "Left",
  };

  const reverseDirection: Record<string, string> = {
    Up: "Down",
    Down: "Up",
    Right: "Left",
    Left: "Right",
  };

  const cellStatus = (r: number, c: number, step: number) => {
    if (r === 0 || r === 8 || c === 0 || c === 8) {
      return step === 1 ? "slotNeighbor" : "slot";
    }
    const piece = board[`${r}-${c}`];
    if (piece) {
      return step === 1 ? "neighbor" : "blocked";
    }

    return "empty";
  };

  const slotViable = (dir: string, distance: number, id: string) => {
    const reverse = reverseDirection[dir];
    if (layout[reverse]?.cell === "neighbor") {
      if (!dropSlotData || distance < dropSlotData.distance) {
        return (dropSlotData = { id, distance });
      }
    }
    return null;
  };

  const layout: Record<string, any> = {};
  let dropSlotData: { id: string; distance: number } | null = null;

  if (cellStatus(row, col, 0) === "blocked") return null;

  for (const dir of Object.values(direction)) {
    const [dRow, dCol] = directionVectors[dir];
    const distance = distanceToSlot[dir];

    for (let i = 1; i <= distance; i++) {
      const r = row + dRow * i;
      const c = col + dCol * i;
      const id = `${r}-${c}`;
      if (r > 8 || r < 0 || c > 8 || c < 0) {
        return null;
      }
      const status = cellStatus(r, c, i);
      if (status === "slotNeighbor") {
        if (slotViable(dir, distance, id)) {
          dropSlotData = { id, distance };
          // return dropSlotData;
        } else {
          layout[dir] = { cell: "neighbor" };
        }
      } else if (status === "neighbor") {
        layout[dir] = { cell: status };
        break;
      } else if (status === "blocked") {
        layout[dir] = { cell: status };
        break;
      } else if (status === "slot") {
        layout[dir] = { cell: status, distance: i };
        if (slotViable(dir, distance, id)) {
          dropSlotData = slotViable(dir, distance, id) || null;
        }
        break;
      }
    }
  }

  return dropSlotData;
};

export default getReachableSlot;
