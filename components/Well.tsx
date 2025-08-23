import { WELL_STYLE } from "@/constants/gameElements";
import { useGameContext } from "@/context/GameContext";
import { CellProps } from "@/types/board";
import React, { useEffect, useRef } from "react";
import { View } from "react-native";

const Well = ({ id, team }: CellProps) => {
  const viewRef = useRef<View>(null);
  const { registerCell } = useGameContext();

  const reportLayout = () => {
    viewRef.current?.measure((x, y, width, height, pageX, pageY) => {
      registerCell({
        id,
        type: "well",
        team,
        layout: { pageX, pageY, width, height },
      });
    });
  };

  useEffect(() => {
    const timer = setTimeout(reportLayout, 0);
    return () => clearTimeout(timer);
  }, []);

  return <View ref={viewRef} onLayout={reportLayout} style={WELL_STYLE} />;
};

export default Well;
