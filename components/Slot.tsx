import { GameElements } from "@/constants";
import { useGameSession } from "@/context/GameSessionContext";
import { useLayout } from "@/context/LayoutContext";
import { useSettings } from "@/context/SettingsContext";
import { Team } from "@/engine";
import { CellProps, CellType } from "@/types/board";
import React, { useCallback, useEffect, useRef } from "react";
import { View } from "react-native";

const Slot = ({ id }: CellProps) => {
  const viewRef = useRef<View>(null);
  const { registerCell, slots } = useLayout();
  const { gameState } = useGameSession();
  const { theme } = useSettings();

  const currentTeam = gameState.currentTeam;

  const reportLayout = useCallback(() => {
    viewRef.current?.measure((x, y, width, height, pageX, pageY) => {
      const prev = slots[id];
      const next = { pageX, pageY, width, height } as const;
      const changed =
        !prev ||
        prev.pageX !== next.pageX ||
        prev.pageY !== next.pageY ||
        prev.width !== next.width ||
        prev.height !== next.height;
      if (changed) {
        registerCell({ id, type: CellType.Slot, layout: next });
      }
    });
  }, [id, registerCell, slots]);

  useEffect(() => {
    const timer = setTimeout(reportLayout, 0);
    return () => clearTimeout(timer);
  }, [reportLayout]);

  const currentTeamColor =
    currentTeam === Team.One
      ? theme.colorTheme.TEAM_ONE_COLOR
      : theme.colorTheme.TEAM_TWO_COLOR;

  const [rowStr] = id.split("-");
  const row = parseInt(rowStr, 10);
  const rotation =
    row === 0 ? "90deg" : row === 8 ? "270deg" : "0deg";

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
          backgroundColor: theme.colorTheme.PIECE_TO_SLOT_COLOR,
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
      />
    </View>
  );
};

export default Slot;
