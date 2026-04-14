import { WELL_STYLE } from "@/constants/gameElements";
import { useLayout } from "@/context/LayoutContext";
import { useSettings } from "@/context/SettingsContext";
import { Team } from "@/engine";
import { CellProps, CellType } from "@/types/board";
import React, { useCallback, useEffect, useRef } from "react";
import { View } from "react-native";

const Well = ({ id, team }: CellProps) => {
  const viewRef = useRef<View>(null);
  const { registerCell } = useLayout();
  const { theme } = useSettings();

  const reportLayout = useCallback(() => {
    viewRef.current?.measure((x, y, width, height, pageX, pageY) => {
      registerCell({
        id,
        type: CellType.Well,
        team,
        layout: { pageX, pageY, width, height },
      });
    });
  }, [registerCell, id, team]);

  useEffect(() => {
    const timer = setTimeout(reportLayout, 0);
    return () => clearTimeout(timer);
  }, [reportLayout]);

  const bgColor =
    team === Team.One
      ? theme.colorTheme.WELL_BG_COLOR_ONE
      : theme.colorTheme.WELL_BG_COLOR_TWO;

  return (
    <View
      ref={viewRef}
      onLayout={reportLayout}
      style={{ ...WELL_STYLE, backgroundColor: bgColor }}
    />
  );
};

export default Well;
