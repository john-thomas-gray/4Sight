import { useGameContext } from "@/context/GameContext";
import { useGravity } from "@/hooks/useGravity"; // Make sure this path is correct
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BoardSpace from "./BoardSpace";
import SlotSpace from "./SlotSpace";

type BoardProps = {
  className?: string;
  onRotate?: (direction: "clockwise" | "counterclockwise") => void;
};

const BOARD_SIZE = 9;

const Board = ({ className, onRotate }: BoardProps) => {
  const { registerBoardSpace, registerSlot } = useGameContext();
  const applyGravity = useGravity(); // ✅ hook

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
    <View style={styles.wrapper}>
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => applyGravity("up")}
        >
          <Text style={styles.buttonText}>↑</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => applyGravity("left")}
        >
          <Text style={styles.buttonText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => applyGravity("right")}
        >
          <Text style={styles.buttonText}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => applyGravity("down")}
        >
          <Text style={styles.buttonText}>↓</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        {Array.from({ length: BOARD_SIZE }).map((_, row) => (
          <View key={row} style={styles.row}>
            {Array.from({ length: BOARD_SIZE }).map((_, col) => {
              if (isSlotPosition(row, col)) {
                const orientation = getOrientation(row, col);
                const id = `${orientation}-${row}-${col}`;
                return (
                  <SlotSpace
                    key={id}
                    id={id}
                    orientation={orientation}
                    team="white"
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
  wrapper: {
    alignItems: "center",
  },
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
  controls: {
    marginTop: 16,
    alignItems: "center",
    flexDirection: "row",
  },
  horizontalButtons: {
    flexDirection: "row",
    gap: 16,
    marginVertical: 8,
  },
  button: {
    padding: 1,
    backgroundColor: "#10b981",
    borderRadius: 8,
    minWidth: 10,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 24,
    color: "white",
    fontWeight: "bold",
  },
});

export default Board;
