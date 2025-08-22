import { useGameContext } from "@/context/GameContext";
import { CellProps } from "@/types/board";
import React, { useEffect, useRef } from "react";
import { Image, View, ViewStyle } from "react-native";
import { icons } from "../constants";

// If a piece is held and the cursor is in the area of a slot space
// project a preview of where that piece would go if released

const Slot = ({ id, team = "white" }: CellProps) => {
  const viewRef = useRef<View>(null);
  const { registerCell } = useGameContext();

  const reportLayout = () => {
    viewRef.current?.measure((x, y, width, height, pageX, pageY) => {
      registerCell({
        id,
        type: "slot",
        layout: { pageX, pageY, width, height },
      });
    });
  };

  useEffect(() => {
    const timer = setTimeout(reportLayout, 0);
    return () => clearTimeout(timer);
  }, []);

  const style: ViewStyle = {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6E2C00", // Deep reddish brown
    borderWidth: 2,
    borderColor: "#C0C0C0", // Silver border
    position: "relative", // Needed for absolutely positioned circle
  };

  const checkDirection = (id: string) => {
    const [row, col]: [number, number] = id.split("-").map(Number) as [
      number,
      number
    ];
    return row === 8 ? "N" : row === 0 ? "S" : col === 0 ? "E" : "W";
  };

  return (
    <View ref={viewRef} style={style}>
      <View
        style={{
          position: "absolute",
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: "#C0C0C0",
          zIndex: 0,
        }}
      />
      <Image
        source={icons.slot[checkDirection(id)][team]}
        style={{
          width: 24,
          height: 24,
          resizeMode: "contain",
          zIndex: 1,
        }}
      />
    </View>
  );
};

export default Slot;
