import {
  BOARD_SIZE_ZERO_IDX,
  CORNER_BORDER_RADIUS,
  CORNER_STYLE,
} from "@/constants/gameElements";
import { useGameContext } from "@/context/GameContext";
import { useLogicGameFlow } from "@/context/LogicContext";
import { CellProps, CellType, Team } from "@/types/board";
import { useEffect, useRef } from "react";
import { View, ViewStyle } from "react-native";

const Corner = ({ id }: CellProps) => {
  const { layout } = useGameContext();
  const { currentTeam } = useLogicGameFlow();
  const { settings } = useGameContext();
  const viewRef = useRef<View>(null);
  const cornerColor =
    currentTeam === Team.TeamOne
      ? settings.theme?.colorTheme?.CORNER_COLOR_ONE || "#ffffff"
      : settings.theme?.colorTheme?.CORNER_COLOR_TWO || "#000000";

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
