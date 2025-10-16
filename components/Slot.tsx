import { GameElements } from "@/constants";
import { useGameContext } from "@/context/GameContext";
import { CellProps, CellType, Team } from "@/types/board";
import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import Svg, { Circle, Mask, Rect } from "react-native-svg";
import { cellImages } from "../assets/images";

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
        borderColor: settings.theme?.colorTheme?.SLOT_BORDER_COLOR || "#C0C0C0",
        zIndex: 1000,
        transform: [{ rotate: rotation }],
      }}
    >
      <Svg height="40" width="40">
        <Mask id="mask">
          {/* White = visible, Black = transparent */}
          <Rect x="0" y="0" width="40" height="40" fill="white" />
          <Circle cx="20" cy="20" r="15" fill="black" />
        </Mask>
        <Rect
          x="0"
          y="0"
          width="40"
          height="40"
          fill="#6E2C00"
          mask="url(#mask)"
        />
      </Svg>

      {/* <View
        ref={viewRef}
        style={{
          ...GameElements.SLOT_STYLE,
          borderColor:
            settings.theme?.colorTheme?.SLOT_BORDER_COLOR || "#C0C0C0",
          backgroundColor:
            settings.theme?.colorTheme?.SLOT_FOREGROUND_COLOR || "#6E2C00",
          transform: [{ rotate: rotation }],
        }}
      >
        <View
          style={{
            position: "absolute",
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor:
              settings.theme?.colorTheme?.SLOT_INSERT_COLOR || "#C0C0C0",
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
          source={
            slotImages[team === Team.TeamOne ? Team.TeamOne : Team.TeamTwo]
          }
          style={{
            width: 24,
            height: 24,
            resizeMode: "contain",
            zIndex: 1,
          }}
        />
      </View> */}
    </View>
  );
};

export default Slot;
