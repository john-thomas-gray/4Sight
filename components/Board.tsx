import { BOARD_COL_ROW_COUNT, BOARD_SIZE } from "@/constants/gameElements";
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

const Board = ({ className, onRotate }: BoardProps) => {
  const { registerBoardSpace, registerSlot, boardSpaces } = useGameContext();

  const corners = [
    { row: 0, col: 0 },
    { row: 0, col: BOARD_COL_ROW_COUNT },
    { row: BOARD_COL_ROW_COUNT, col: 0 },
    { row: BOARD_COL_ROW_COUNT, col: BOARD_COL_ROW_COUNT },
  ];

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

  const gestureStartedOnCorner = useRef(false);
  const startTouch = useRef<{ x: number; y: number } | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { pageX, pageY } = evt.nativeEvent;
        gestureStartedOnCorner.current = isTouchOnCorner(pageX, pageY);
        startTouch.current = { x: pageX, y: pageY };
      },

      onPanResponderMove: () => {},

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
      (row === 0 && col > 0 && col < BOARD_COL_ROW_COUNT) || // Top
      (row === BOARD_COL_ROW_COUNT && col > 0 && col < BOARD_COL_ROW_COUNT) || // Bottom
      (col === 0 && row > 0 && row < BOARD_COL_ROW_COUNT) || // Left
      (col === BOARD_COL_ROW_COUNT && row > 0 && row < BOARD_COL_ROW_COUNT) // Right
    );
  };

  return (
    <View {...panResponder.panHandlers} className={className}>
      <View style={styles.container}>
        {Array.from({ length: BOARD_SIZE }).map((_, row) => (
          <View key={row} style={styles.row}>
            {Array.from({ length: BOARD_SIZE }).map((_, col) => {
              if (isSlotPosition(row, col)) {
                const id = `${row}-${col}`;
                return <SlotSpace key={id} id={id} team="white" />;
              }

              const id = `${row}-${col}`;
              return <BoardSpace key={id} id={id} />;
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
