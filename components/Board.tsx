import { BOARD_COL_ROW_COUNT, BOARD_SIZE } from "@/constants/gameElements";
import React from "react";
import { StyleSheet, View } from "react-native";
import Slot from "./Slot";
import Space from "./Space";

type BoardProps = {
  className?: string;
  onRotate?: (direction: "clockwise" | "counterclockwise") => void;
};

const Board = ({ className, onRotate }: BoardProps) => {
  const isSlotPosition = (row: number, col: number) => {
    return (
      (row === 0 && col > 0 && col < BOARD_COL_ROW_COUNT) || // Top
      (row === BOARD_COL_ROW_COUNT && col > 0 && col < BOARD_COL_ROW_COUNT) || // Bottom
      (col === 0 && row > 0 && row < BOARD_COL_ROW_COUNT) || // Left
      (col === BOARD_COL_ROW_COUNT && row > 0 && row < BOARD_COL_ROW_COUNT) // Right
    );
  };

  return (
    <View className={className}>
      <View style={styles.container}>
        {Array.from({ length: BOARD_SIZE }).map((_, row) => (
          <View key={row} style={styles.row}>
            {Array.from({ length: BOARD_SIZE }).map((_, col) => {
              if (isSlotPosition(row, col)) {
                const id = `${row}-${col}`;
                return <Slot key={id} id={id} type="slot" />;
              }

              const id = `${row}-${col}`;
              return <Space key={id} type="space" id={id} />;
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: 40 * BOARD_SIZE,
    height: 40 * BOARD_SIZE,
    paddingHorizontal: 4,
    backgroundColor: "#065f46",
    borderRadius: 8,
  },
  row: {
    flexDirection: "row",
    height: 40,
  },
});

export default Board;
