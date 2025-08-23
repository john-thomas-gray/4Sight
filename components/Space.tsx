import { SPACE_STYLE } from "@/constants/gameElements";
import { useGameContext } from "@/context/GameContext";
import { CellProps } from "@/types/board";
import { useEffect, useRef } from "react";
import { View, ViewStyle } from "react-native";

const Space = ({ id }: CellProps) => {
  const { layout } = useGameContext();
  const viewRef = useRef<View>(null);

  const reportLayout = () => {
    viewRef.current?.measure((x, y, width, height, pageX, pageY) => {
      layout.registerCell({
        id,
        type: "space",
        layout: { pageX, pageY, width, height },
      });
    });
  };

  useEffect(() => {
    const timer = setTimeout(reportLayout, 0);
    return () => clearTimeout(timer);
  }, []);

  const [rowStr, colStr] = id.split("-");
  const row = parseInt(rowStr, 10);
  const col = parseInt(colStr, 10);
  const isEven = (row + col) % 2 === 0;

  const style: ViewStyle = {
    ...SPACE_STYLE,
    backgroundColor: isEven ? "#d1fae5" : "#ffffff",
  };

  return <View ref={viewRef} onLayout={reportLayout} style={style} />;
};

export default Space;
