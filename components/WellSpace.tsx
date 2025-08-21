import { useGameContext } from "@/context/GameContext";
import { CellProps } from "@/types/board";
import React, { useEffect, useRef } from "react";
import { View, ViewStyle } from "react-native";

const WellSpace = ({ id, team }: CellProps) => {
  const viewRef = useRef<View>(null);
  const { registerWellSpace } = useGameContext();

  const reportLayout = () => {
    viewRef.current?.measure((x, y, width, height, pageX, pageY) => {
      registerWellSpace(id, team, { pageX, pageY, width, height });
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
    backgroundColor: "#065f46",
    borderWidth: 1,
    borderColor: "silver",
  };

  return <View ref={viewRef} onLayout={reportLayout} style={style} />;
};

export default WellSpace;
