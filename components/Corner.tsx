import {
  BOARD_SIZE_ZERO_IDX,
  CORNER_BORDER_RADIUS,
  CORNER_STYLE,
} from "@/constants/gameElements";
import { useGameContext } from "@/context/GameContext";
import { CellProps } from "@/types/board";
import { useEffect, useRef } from "react";
import { View, ViewStyle } from "react-native";

const Corner = ({ id }: CellProps) => {
  const { registerCell } = useGameContext();
  const viewRef = useRef<View>(null);

  const reportLayout = () => {
    viewRef.current?.measure((x, y, width, height, pageX, pageY) => {
      registerCell({
        id,
        type: "corner",
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

  const style: ViewStyle = {
    ...CORNER_STYLE,
    borderTopLeftRadius: row === 0 && col === 0 ? CORNER_BORDER_RADIUS : 0,
    borderTopRightRadius:
      row === 0 && col === BOARD_SIZE_ZERO_IDX ? CORNER_BORDER_RADIUS : 0,
    borderBottomLeftRadius:
      row === BOARD_SIZE_ZERO_IDX && col === 0 ? CORNER_BORDER_RADIUS : 0,
    borderBottomRightRadius:
      row === BOARD_SIZE_ZERO_IDX && col === BOARD_SIZE_ZERO_IDX
        ? CORNER_BORDER_RADIUS
        : 0,
  };

  return <View ref={viewRef} onLayout={reportLayout} style={style} />;
};

export default Corner;
