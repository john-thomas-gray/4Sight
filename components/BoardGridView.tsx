import {
  BASE_CELL_SIZE,
  BOARD_SIZE,
  BOARD_SIZE_ZERO_IDX,
  CORNER_BORDER_RADIUS,
} from "@/constants/gameElements";
import { surfaceStyles } from "@/constants/surfaceStyles";
import { CellType } from "@/types/board";
import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import Corner from "./Corner";
import Slot from "./Slot";
import Space from "./Space";
import SurfaceGradient from "./SurfaceGradient";

function isCornerPosition(row: number, col: number): boolean {
  return (
    (row === 0 || row === BOARD_SIZE_ZERO_IDX) &&
    (col === 0 || col === BOARD_SIZE_ZERO_IDX)
  );
}

function isSlotPosition(row: number, col: number): boolean {
  return (
    ((row === 0 || row === BOARD_SIZE_ZERO_IDX) &&
      col > 0 &&
      col < BOARD_SIZE_ZERO_IDX) ||
    ((col === 0 || col === BOARD_SIZE_ZERO_IDX) &&
      row > 0 &&
      row < BOARD_SIZE_ZERO_IDX)
  );
}

const BoardGridView: React.FC = () => {
  return (
    <View style={[styles.board, surfaceStyles.board]}>
      {Array.from({ length: BOARD_SIZE }).map((_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: BOARD_SIZE }).map((_, col) => {
            const id = `${row}-${col}`;
            if (isCornerPosition(row, col)) {
              return <Corner key={id} id={id} type={CellType.Corner} />;
            }
            if (isSlotPosition(row, col)) {
              return <Slot key={id} id={id} type={CellType.Slot} />;
            }
            return <Space key={id} id={id} type={CellType.Space} />;
          })}
        </View>
      ))}
      <SurfaceGradient variant="board" borderRadius={CORNER_BORDER_RADIUS} />
    </View>
  );
};

const styles = StyleSheet.create({
  board: {
    borderRadius: CORNER_BORDER_RADIUS,
  },
  row: {
    flexDirection: "row",
    height: BASE_CELL_SIZE,
  },
});

export default memo(BoardGridView);
