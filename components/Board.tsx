import { useGameContext } from "@/context/GameContext";
import React from "react";
import { StyleSheet, View } from "react-native";
import BoardSpace from "./BoardSpace";
import SlotSpace from "./SlotSpace";

type BoardProps = {
  className?: string;
};

const BOARD_SIZE = 9;

const Board = ({ className }: BoardProps) => {
  const { registerBoardSpace, registerSlot } = useGameContext();

  const isSlotPosition = (row: number, col: number) => {
    return (
      (row === 0 && col > 0 && col < BOARD_SIZE - 1) || // Top
      (row === BOARD_SIZE - 1 && col > 0 && col < BOARD_SIZE - 1) || // Bottom
      (col === 0 && row > 0 && row < BOARD_SIZE - 1) || // Left
      (col === BOARD_SIZE - 1 && row > 0 && row < BOARD_SIZE - 1) // Right
    );
  };

  const getOrientation = (row: number, col: number): "N" | "S" | "E" | "W" => {
    if (row === 0) return "S";
    if (row === BOARD_SIZE - 1) return "N";
    if (col === 0) return "E";
    return "W"; // col === last
  };

  return (
    <View className={className}>
      <View style={styles.container}>
        {Array.from({ length: BOARD_SIZE }).map((_, row) => (
          <View key={row} style={styles.row}>
            {Array.from({ length: BOARD_SIZE }).map((_, col) => {
              if (isSlotPosition(row, col)) {
                const orientation = getOrientation(row, col);
                const id = `slot-${orientation}-${row}-${col}`;
                return (
                  <SlotSpace
                    key={id}
                    id={id}
                    orientation={orientation}
                    team="white" // Or dynamic if needed
                    register={registerSlot}
                  />
                );
              }

              const id = `${row}-${col}`;
              return (
                <BoardSpace key={id} id={id} register={registerBoardSpace} />
              );
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
