import { GameElements } from "@/constants";

import { useGameContext } from "@/context/GameContext";
import { useLogicAnimations, useLogicBoardState } from "@/context/LogicContext";
import { CellProps, CellType } from "@/types/board";
import { useEffect, useRef } from "react";
import { View, ViewStyle } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
} from "react-native-reanimated";

const Space = ({ id }: CellProps) => {
  const { layout, settings } = useGameContext();
  const { nextTurnWins } = useLogicBoardState();
  const { highlightPulse } = useLogicAnimations();
  const viewRef = useRef<View>(null);

  const reportLayout = () => {
    viewRef.current?.measure((x, y, width, height, pageX, pageY) => {
      layout.registerCell({
        id,
        type: CellType.Space,
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

  const baseColor = isEven
    ? settings.theme?.colorTheme?.EVEN_SPACE_COLOR || "#d1fae5"
    : settings.theme?.colorTheme?.ODD_SPACE_COLOR || "#ffffff";

  const shouldHighlight =
    settings.highlightWinningMoves && !!(nextTurnWins && nextTurnWins[id]);

  const animatedStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      highlightPulse.value,
      [0, 1],
      [baseColor, "#FFD700"]
    );
    return {
      backgroundColor: shouldHighlight ? color : baseColor,
    } as ViewStyle;
  });

  const style: ViewStyle = {
    ...GameElements.SPACE_STYLE,
  };

  return (
    <Animated.View
      ref={viewRef}
      onLayout={reportLayout}
      style={[style, animatedStyle]}
    />
  );
};

export default Space;
