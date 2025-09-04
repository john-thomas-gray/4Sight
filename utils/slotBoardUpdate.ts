import { GameElements } from "@/constants";
import { CellProps } from "@/types/board";
import { runOnJS, SharedValue } from "react-native-reanimated";

type SlotBoardUpdate = {
  selectedCell: CellProps;
  setBPLUI: (finalSpaceId: string) => void;
  bPLSV: SharedValue<Record<string, string>>;
};

const slotBoardUpdate = ({
  selectedCell,
  bPLSV,
  setBPLUI,
}: SlotBoardUpdate) => {
  "worklet";

  let [nextRow, nextCol] = selectedCell.id.split("-").map(Number) as [
    number,
    number
  ];
  let prevRow: number | null = null;
  let prevCol: number | null = null;
  const slotDirection =
    nextRow === 8 ? "N" : nextRow === 0 ? "S" : nextCol === 0 ? "E" : "W";

  const deltas: Record<string, { dr: number; dc: number }> = {
    N: { dr: -1, dc: 0 },
    S: { dr: 1, dc: 0 },
    E: { dr: 0, dc: 1 },
    W: { dr: 0, dc: -1 },
  };

  nextRow += deltas[slotDirection].dr;
  nextCol += deltas[slotDirection].dc;

  while (true) {
    const nextSpaceId = `${nextRow}-${nextCol}`;
    const nextSpace = bPLSV.value[nextSpaceId];

    const isOccupied = bPLSV.value[nextSpaceId] !== undefined;

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

  if (prevRow === null || prevCol === null) {
    console.warn("No free board space near slot:", selectedCell.id);

    return { status: "blocked", finalSpaceId: null, finalSpaceLayout: null };
  }

  const finalSpaceId = `${prevRow}-${prevCol}`;
  const finalSpaceLayout = bPLSV.value[finalSpaceId];

  if (!finalSpaceLayout) {
    console.warn("No layout for final board space", finalSpaceId);
    return;
  }

  runOnJS(setBPLUI)(finalSpaceId);

  return { status: "placed", finalSpaceId, finalSpaceLayout };
};

export default slotBoardUpdate;

// const update = slotBoardUpdate({
//   selectedCell: selectedCell,
//   bPLSV: boardPieceLocationsSV,
//   setBPLUI,
// });
