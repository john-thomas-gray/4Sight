import { useGameContext } from "@/context/GameContext";
import { CellProps } from "@/types/board";
import React, { useEffect, useRef } from "react";
import { View, ViewStyle } from "react-native";

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

  const style: ViewStyle = {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 1,
    backgroundColor: "#377a67ff",
    borderWidth: 1,
    borderColor: "silver",
  };

  return <View ref={viewRef} onLayout={reportLayout} style={style} />;
};

export default Well;
