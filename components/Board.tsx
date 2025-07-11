import { useGameContext } from "@/context/GameContext";
import React, { useRef } from "react";
import {
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  View,
} from "react-native";
import BoardSpace from "./BoardSpace";
import SlotSpace from "./SlotSpace";

type BoardProps = {
  className?: string;
  onRotate?: (direction: "clockwise" | "counterclockwise") => void; // Callback to rotate board
};

const BOARD_SIZE = 9;
const CORNER_SIZE = 40; // same as space size

const Board = ({ className, onRotate }: BoardProps) => {
  const { registerBoardSpace, registerSlot, boardSpaces } = useGameContext();

  // Identify corner positions (row,col)
  const corners = [
    { row: 0, col: 0 },
    { row: 0, col: BOARD_SIZE - 1 },
    { row: BOARD_SIZE - 1, col: 0 },
    { row: BOARD_SIZE - 1, col: BOARD_SIZE - 1 },
  ];

  // Check if touch point is inside a corner space
  const isTouchOnCorner = (x: number, y: number) => {
    for (const corner of corners) {
      const id = `${corner.row}-${corner.col}`;
      const layout = boardSpaces[id];
      if (!layout) continue;
      if (
        x >= layout.pageX &&
        x <= layout.pageX + layout.width &&
        y >= layout.pageY &&
        y <= layout.pageY + layout.height
      ) {
        return true;
      }
    }
    return false;
  };

  // Track if gesture started on corner
  const gestureStartedOnCorner = useRef(false);
  // Track initial touch position
  const startTouch = useRef<{ x: number; y: number } | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { pageX, pageY } = evt.nativeEvent;
        gestureStartedOnCorner.current = isTouchOnCorner(pageX, pageY);
        startTouch.current = { x: pageX, y: pageY };
      },

      onPanResponderMove: () => {
        // We don't need to do anything here
      },

      onPanResponderRelease: (
        evt: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        if (!gestureStartedOnCorner.current) return;

        const { dx, dy } = gestureState;

        // Determine swipe direction only if significant movement
        const threshold = 30; // minimum swipe distance in px
        if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

        // For rotation, let's only consider horizontal swipes:
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) {
            // Swipe right → rotate clockwise
            onRotate && onRotate("clockwise");
          } else {
            // Swipe left → rotate counterclockwise
            onRotate && onRotate("counterclockwise");
          }
        } else {
          // Optional: vertical swipes could do something else or ignore
        }
      },
    })
  ).current;

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
    <View {...panResponder.panHandlers} className={className}>
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
