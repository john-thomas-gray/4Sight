import { GameElements } from "@/constants";

import { useGameContext } from "@/context/GameContext";
import { CellProps } from "@/types/board";
import { useEffect, useRef } from "react";
import { View, ViewStyle } from "react-native";

const Space = ({ id }: CellProps) => {
  const { layout, settings } = useGameContext();
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
    ...GameElements.SPACE_STYLE,
    backgroundColor: isEven
      ? settings.colorTheme.EVEN_SPACE_COLOR
      : settings.colorTheme.ODD_SPACE_COLOR,
  };

  return <View ref={viewRef} onLayout={reportLayout} style={style} />;
};

export default Space;
