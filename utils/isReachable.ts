import { BOARD_SIZE_ZERO_IDX } from "@/constants/gameElements";
import { Direction } from "@/types/board";

const isReachable = (board: Record<string, string>, targetCell: string) => {
  "worklet";
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
    if (
      r === 0 ||
      r === BOARD_SIZE_ZERO_IDX ||
      c === 0 ||
      c === BOARD_SIZE_ZERO_IDX
    ) {
      return "slot";
    }
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

  let NNO = false;
  let SNO = false;
  let ENO = false;
  let WNO = false;
  let NSB = false;
  let SSB = false;
  let ESB = false;
  let WSB = false;
  let verticalBlocked = false;
  let horizontalBlocked = false;
  let viableSlot = null;

  for (const dir of Object.values(Direction)) {
    const [dRow, dCol] = DirectionVectors[dir];
    const distance = DistanceToSlot[dir];

    for (let i = 1; i <= distance; i++) {
      const r = row + dRow * i;
      const c = col + dCol * i;

      if (checkCell(r, c) === "occupied") {
        if (i === 1) {
          // Neighboring occupied cell
          switch (dir) {
            case Direction.Up:
              NNO = true;
              NSB = true;
              break;
            case Direction.Down:
              SNO = true;
              SSB = true;
              break;
            case Direction.Right:
              ENO = true;
              ESB = true;
              break;
            case Direction.Left:
              WNO = true;
              WSB = true;
              break;
          }
        } else {
          // Blocked by another piece
          switch (dir) {
            case Direction.Up:
              NSB = true;
              break;
            case Direction.Down:
              SSB = true;
              break;
            case Direction.Right:
              ESB = true;
              break;
            case Direction.Left:
              WSB = true;
              break;
          }
        }
        break;
      } else if (checkCell(r, c) === "slot") {
        viableSlot = `${r}-${c}`;
      }
    }
  }

  if ((NSB && SSB) || (NSB && !SNO) || (SSB && !NNO)) {
    verticalBlocked = true;
  }
  if ((ESB && WSB) || (ESB && !WNO) || (WSB && !ENO)) {
    horizontalBlocked = true;
  }

  return {
    reachable: !verticalBlocked && !horizontalBlocked,
    viableSlot: viableSlot,
  };
};

export default isReachable;

// POSSIBLE REFACTOR WITH SETS
// import { BOARD_SIZE_ZERO_IDX } from "@/constants/gameElements";
// import { Direction } from "@/types/board";

// const isReachable = (board: Record<string, string>, targetCell: string) => {
//   "worklet";

//   const [row, col] = targetCell.split("-").map(Number);

//   const distanceToSlot: Record<Direction, number> = {
//     [Direction.Up]: row,
//     [Direction.Down]: BOARD_SIZE_ZERO_IDX - row,
//     [Direction.Right]: BOARD_SIZE_ZERO_IDX - col,
//     [Direction.Left]: col,
//   };

//   const directionVectors: Record<Direction, [number, number]> = {
//     [Direction.Up]: [-1, 0],
//     [Direction.Down]: [1, 0],
//     [Direction.Right]: [0, 1],
//     [Direction.Left]: [0, -1],
//   };

//   const cellStatus = (r: number, c: number) =>
//     board[`${r}-${c}`] ? "occupied" : "empty";

//   const vertical = new Set<string>();
//   const horizontal = new Set<string>();

//   if (cellStatus(row, col) === "occupied") return false;

//   for (const dir of Object.values(Direction)) {
//     const [dRow, dCol] = directionVectors[dir];
//     const distance = distanceToSlot[dir];

//     for (let i = 1; i <= distance; i++) {
//       const r = row + dRow * i;
//       const c = col + dCol * i;

//       if (cellStatus(r, c) === "occupied") {
//         const isNeighbor = i === 1;

//         if (dir === Direction.Up || dir === Direction.Down) {
//           vertical.add(isNeighbor ? "neighbor" : "blocked");
//         } else {
//           horizontal.add(isNeighbor ? "neighbor" : "blocked");
//         }
//         break;
//       }
//     }
//   }

//   const verticalBlocked =
//     vertical.has("blocked") ||
//     (vertical.has("neighbor") && vertical.has("blocked"));

//   const horizontalBlocked =
//     horizontal.has("blocked") ||
//     (horizontal.has("neighbor") && horizontal.has("blocked"));

//   const reachable = !verticalBlocked && !horizontalBlocked;

//   console.log("in reachable is reachable:", reachable);
//   return reachable;
// };

// export default isReachable;
