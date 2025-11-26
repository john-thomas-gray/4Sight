import { GameElements } from "@/constants";
import { Direction } from "@/types/board";
import { PieceStatus } from "@/types/logic";
import { DetectHoverProps } from "@/types/utils";
import { scheduleOnRN } from "react-native-worklets";

export const detectHover = ({pieceStatus, allCells, adjustedPointerCoordinates, layout, boardPieceLocationsValue, setHover}:DetectHoverProps) => {
  "worklet";
  if (pieceStatus === PieceStatus.isHeld)
  {
    let overAnySlot = false;
    const {x, y} = adjustedPointerCoordinates;
    for (const cell of allCells) {
      if (!cell.layout) continue;
      const { pageX, pageY, width, height } = cell.layout;
      const inside =
        x >= pageX &&
        x <= pageX + width &&
        y >= pageY &&
        y <= pageY + height;
      if (inside && cell.id in layout.slots) {
        overAnySlot = true;
        let [nextRow, nextCol] = cell.id.split("-").map(Number) as [
          number,
          number
        ];
        const slotDirection =
          nextRow === 8
            ? Direction.Up
            : nextRow === 0
            ? Direction.Down
            : nextCol === 0
            ? Direction.Right
            : Direction.Left;
        const deltas: Record<Direction, { dr: number; dc: number }> = {
          [Direction.Up]: { dr: -1, dc: 0 },
          [Direction.Down]: { dr: 1, dc: 0 },
          [Direction.Right]: { dr: 0, dc: 1 },
          [Direction.Left]: { dr: 0, dc: -1 },
        };
        nextRow += deltas[slotDirection].dr;
        nextCol += deltas[slotDirection].dc;

        let prevRow: number | null = null;
        let prevCol: number | null = null;

        while (true) {
          const nextSpaceId = `${nextRow}-${nextCol}`;
          const nextSpace = layout.spaces[nextSpaceId];
          const isOccupied =
            boardPieceLocationsValue[nextSpaceId] !== undefined;

          if (
            nextRow < 0 ||
            nextRow >= GameElements.BOARD_SIZE ||
            nextCol < 0 ||
            nextCol >= GameElements.BOARD_SIZE
          )
            break;

          if (!nextSpace) break;
          if (isOccupied) break;

          prevRow = nextRow;
          prevCol = nextCol;
          nextRow += deltas[slotDirection].dr;
          nextCol += deltas[slotDirection].dc;
        }

        if (prevRow !== null && prevCol !== null) {
          const finalSpaceId = `${prevRow}-${prevCol}`;
          scheduleOnRN(setHover, finalSpaceId);
        } else {
          scheduleOnRN(setHover, null);
        }
        break;
      }
    }
    if (!overAnySlot) {
      scheduleOnRN(setHover, null);
    }
  }
}
