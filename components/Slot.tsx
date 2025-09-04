import { GameElements } from "@/constants";
import { useGameContext } from "@/context/GameContext";
import { CellProps, CellType, Team } from "@/types/board";
import React, { useEffect, useRef } from "react";
import { Image, View } from "react-native";
import { cellImages } from "../assets/images";

// If a piece is held and the cursor is in the area of a slot space
// project a preview of where that piece would go if released

const Slot = ({ id, team }: CellProps) => {
  const viewRef = useRef<View>(null);
  const { layout, logic } = useGameContext();
  const { settings } = useGameContext();

  team = logic.currentTeam;

  const reportLayout = () => {
    viewRef.current?.measure((x, y, width, height, pageX, pageY) => {
      layout.registerCell({
        id,
        type: CellType.Slot,
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

  const direction = checkDirection(id);
  const currentTeamColor =
    team === Team.TeamOne
      ? settings.colorTheme.TEAM_ONE_COLOR
      : settings.colorTheme.TEAM_TWO_COLOR;

  const rotation =
    direction === "S"
      ? "90deg"
      : direction === "N"
      ? "270deg"
      : direction === "W"
      ? "180deg"
      : "0deg";

  const slotImages = cellImages.slot["C"] as Record<string, any>;

  return (
    <View
      ref={viewRef}
      style={{
        ...GameElements.SLOT_STYLE,
        borderColor: settings.colorTheme.SLOT_BORDER_COLOR,
        backgroundColor: settings.colorTheme.SLOT_BACKGROUND_COLOR,
        transform: [{ rotate: rotation }],
      }}
    >
      <View
        style={{
          position: "absolute",
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: settings.colorTheme.SLOT_INSERT_COLOR,
          zIndex: 0,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 18,
          height: 8,
          marginEnd: 2,
          borderRadius: 14,
          backgroundColor: currentTeamColor,
        }}
      ></View>
      <Image
        source={slotImages[team === Team.TeamOne ? Team.TeamOne : Team.TeamTwo]}
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
