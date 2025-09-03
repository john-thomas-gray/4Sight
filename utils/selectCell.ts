import { GameElements } from "@/constants";
import { CellProps } from "@/types/board";
import { SharedValue } from "react-native-reanimated";

type SelectCellProps = {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  allCells: CellProps[];
};

const selectCell = ({ translateX, translateY, allCells }: SelectCellProps) => {
  "worklet";
  const pieceCenter = {
    x: translateX.value + GameElements.PIECE_RADIUS,
    y: translateY.value + GameElements.PIECE_RADIUS,
  };

  for (const selectedCell of allCells) {
    if (!selectedCell.layout) continue;

    const {
      pageX: sourceCellCoordX,
      pageY: sourceCellCoordY,
      width: sourceCellWidth,
      height: sourceCellHeight,
    } = selectedCell.layout;

    const cellFound =
      pieceCenter.x >= sourceCellCoordX &&
      pieceCenter.x <= sourceCellCoordX + sourceCellWidth &&
      pieceCenter.y >= sourceCellCoordY &&
      pieceCenter.y <= sourceCellCoordY + sourceCellHeight;

    if (!cellFound) continue;
    if (cellFound) return selectedCell;
  }
};

export default selectCell;
