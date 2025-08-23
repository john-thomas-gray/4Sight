import { SLOT_STYLE } from "@/constants/gameElements";
import { useGameContext } from "@/context/GameContext";
import { CellProps } from "@/types/board";
import { Team } from "@/types/logic";
import React, { useEffect, useRef } from "react";
import { Image, View } from "react-native";
import { icons } from "../constants";

// If a piece is held and the cursor is in the area of a slot space
// project a preview of where that piece would go if released

const Slot = ({ id, team }: CellProps) => {
  const viewRef = useRef<View>(null);
  const { layout, logic } = useGameContext();
  team = logic.currentTeam;

  const reportLayout = () => {
    viewRef.current?.measure((x, y, width, height, pageX, pageY) => {
      layout.registerCell({
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

  const checkDirection = (id: string) => {
    const [row, col]: [number, number] = id.split("-").map(Number) as [
      number,
      number
    ];
    return row === 8 ? "N" : row === 0 ? "S" : col === 0 ? "E" : "W";
  };

  return (
    <View ref={viewRef} style={SLOT_STYLE}>
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
        source={icons.slot[checkDirection(id)][team as Team]}
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
