import {
  BOARD_SIZE_ZERO_IDX,
  CORNER_BORDER_RADIUS,
  CORNER_STYLE,
} from "@/constants/gameElements";
import { useMegaContext } from "@/context/MegaContext";
import { CellProps, CellType, Team } from "@/types/board";
import { useEffect, useRef } from "react";
import { View, ViewStyle } from "react-native";

const Corner = ({ id }: CellProps) => {
  const { layout, logic } = useMegaContext();
  const { settings } = useMegaContext();
  const viewRef = useRef<View>(null);
  const cornerColor =
    logic.currentTeam === Team.TeamOne
      ? settings.colorTheme.CORNER_COLOR_ONE
      : settings.colorTheme.CORNER_COLOR_TWO;

  const reportLayout = () => {
    viewRef.current?.measure((x, y, width, height, pageX, pageY) => {
      layout.registerCell({
        id,
        type: CellType.Corner,
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
    backgroundColor: cornerColor,
  };

  return <View ref={viewRef} onLayout={reportLayout} style={style} />;
};

export default Corner;
