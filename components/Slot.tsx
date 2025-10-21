import { GameElements } from "@/constants";
import { useGameContext } from "@/context/GameContext";
import { CellProps, CellType, Team } from "@/types/board";
import React, { useCallback, useEffect, useRef } from "react";
import { Image, View } from "react-native";
import { cellImages } from "../assets/images";

const Slot = ({ id, team }: CellProps) => {
  const viewRef = useRef<View>(null);
  const { layout, logic } = useGameContext();
  const { settings } = useGameContext();

  team = logic.currentTeam;

  const reportLayout = useCallback(() => {
    viewRef.current?.measure((x, y, width, height, pageX, pageY) => {
      const prev = layout.slots[id];
      const next = { pageX, pageY, width, height } as const;
      const changed =
        !prev ||
        prev.pageX !== next.pageX ||
        prev.pageY !== next.pageY ||
        prev.width !== next.width ||
        prev.height !== next.height;
      if (changed) {
        layout.registerCell({
          id,
          type: CellType.Slot,
          layout: next,
        });
      }
    });
  }, [id, layout]);

  useEffect(() => {
    const timer = setTimeout(reportLayout, 0);
    return () => clearTimeout(timer);
  }, [reportLayout]);

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
      ? settings.theme?.colorTheme?.TEAM_ONE_COLOR || "#ffffff"
      : settings.theme?.colorTheme?.TEAM_TWO_COLOR || "#000000";

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
        borderWidth: 0,
        transform: [{ rotate: rotation }],
      }}
    >
      <View
        style={{
          position: "absolute",
          width: 36,
          height: 36,
          borderRadius: 14,
          backgroundColor:
            settings.theme?.colorTheme?.PIECE_TO_SLOT_COLOR || "#C0C0C0",
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
