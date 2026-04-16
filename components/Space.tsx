import { GameElements } from "@/constants";
import { useGameSession } from "@/context/GameSessionContext";
import { useLayout } from "@/context/LayoutContext";
import {
  EMPTY_PLAYFIELD_REF,
  measureLayoutRelativeToPlayfield,
  usePlayfieldFrameOptional,
} from "@/context/PlayfieldFrameContext";
import { useSettings } from "@/context/SettingsContext";
import { CellProps, CellType } from "@/types/board";
import { useCallback, useEffect, useRef } from "react";
import { View, ViewStyle } from "react-native";

const Space = ({ id }: CellProps) => {
  const { registerCell } = useLayout();
  const { nextTurnWins } = useGameSession();
  const { theme, highlightWinningMoves } = useSettings();
  const viewRef = useRef<View>(null);
  const playfield = usePlayfieldFrameOptional();
  const playfieldRef = playfield?.playfieldRef ?? EMPTY_PLAYFIELD_REF;

  const reportLayout = useCallback(() => {
    measureLayoutRelativeToPlayfield(viewRef, playfieldRef, (layout) => {
      registerCell({
        id,
        type: CellType.Space,
        layout,
      });
    });
  }, [registerCell, id, playfieldRef]);

  useEffect(() => {
    const timer = setTimeout(reportLayout, 0);
    return () => clearTimeout(timer);
  }, [reportLayout]);

  const [rowStr, colStr] = id.split("-");
  const row = parseInt(rowStr, 10);
  const col = parseInt(colStr, 10);
  const isEven = (row + col) % 2 === 0;

  const baseColor = isEven
    ? theme.colorTheme.EVEN_SPACE_COLOR
    : theme.colorTheme.ODD_SPACE_COLOR;
  const shouldHighlight =
    highlightWinningMoves && !!(nextTurnWins && nextTurnWins[id]);

  const style: ViewStyle = {
    ...GameElements.SPACE_STYLE,
    backgroundColor: shouldHighlight ? "#FFD700" : baseColor,
  };

  return <View ref={viewRef} onLayout={reportLayout} style={style} />;
};

export default Space;
