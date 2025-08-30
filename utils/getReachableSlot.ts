import { BOARD_SIZE_ZERO_IDX } from "@/constants/gameElements";

const getReachableSlot = (
  board: Record<string, string>,
  targetCell: string
) => {
  "worklet";
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

  const layout: Record<string, any> = {};
  layout.dropSlot = { id: "null", distance: 99 };

  if (cellStatus(row, col, 0) === "blocked")
    return (layout.dropSlot = { id: "abort", distance: 99 });

  for (const dir of Object.values(direction)) {
    const [dRow, dCol] = directionVectors[dir];
    const distance = distanceToSlot[dir];

    for (let i = 1; i <= distance; i++) {
      const r = row + dRow * i;
      const c = col + dCol * i;
      const id = `${r}-${c}`;
      if (r > 8 || r < 0 || c > 8 || c < 0) {
        return (layout.dropSlot = {
          id: "out of bounds",
          distance: 99,
        });
      }
      const status = cellStatus(r, c, i);

      if (status === "empty") {
        layout[dir] = { cell: status, id: id, distance: i };
        continue;
      }

      if (status === "slotNeighbor") {
        layout[dir] = { cell: status, id: id, distance: i };
        break;
      } else if (status === "neighbor") {
        layout[dir] = { cell: status, id: id, distance: i };
        break;
      } else if (status === "blocked") {
        layout[dir] = { cell: status, id: id, distance: i };
        break;
      } else if (status === "slot") {
        layout[dir] = { cell: status, id: id, distance: i };
        break;
      }
    }
  }

  for (const dir of Object.keys(direction)) {
    const reverse = reverseDirection[dir];
    if (
      (layout[dir].cell === "slot" && layout[reverse].cell === "neighbor") ||
      (layout[dir].cell === "slot" &&
        layout[reverse].cell === "slotNeighbor") ||
      (layout[dir].cell === "slotNeighbor" &&
        layout[reverse].cell === "neighbor")
    ) {
      if (layout[dir].distance < layout.dropSlot.distance) {
        layout.dropSlot = {
          id: layout[dir].id,
          distance: layout[dir].distance,
        };
      }
    }
  }
  return layout;
};

export default getReachableSlot;
