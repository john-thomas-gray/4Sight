import slotArrowClear from "@/assets/images/slot-arrow-clear.png";
import { GameElements } from "@/constants";
import { useGameSession } from "@/context/GameSessionContext";
import { useLayout } from "@/context/LayoutContext";
import {
  EMPTY_PLAYFIELD_REF,
  measureLayoutRelativeToPlayfield,
  usePlayfieldFrameOptional,
} from "@/context/PlayfieldFrameContext";
import { useSettings } from "@/context/SettingsContext";
import { useUi } from "@/context/UiContext";
import {
  Team,
  getFirstOccupiedInSlotPath,
  getSlotEntryDirection,
  keyToCoord,
  resolveSlotDrop,
} from "@/engine";
import { CellProps, CellType } from "@/types/board";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Image, View } from "react-native";

const Slot = ({ id }: CellProps) => {
  const viewRef = useRef<View>(null);
  const { registerCell, slots } = useLayout();
  const { gameState } = useGameSession();
  const { theme } = useSettings();
  const { tutorialInaccessibleSlotEntryDirection } = useUi();
  const playfield = usePlayfieldFrameOptional();
  const playfieldRef = playfield?.playfieldRef ?? EMPTY_PLAYFIELD_REF;

  const currentTeam = gameState.currentTeam;

  const reportLayout = useCallback(() => {
    measureLayoutRelativeToPlayfield(viewRef, playfieldRef, (layout) => {
      const prev = slots[id];
      const next = layout;
      const changed =
        !prev ||
        prev.pageX !== next.pageX ||
        prev.pageY !== next.pageY ||
        prev.width !== next.width ||
        prev.height !== next.height;
      if (changed) {
        registerCell({ id, type: CellType.Slot, layout: next });
      }
    });
  }, [id, registerCell, slots, playfieldRef]);

  useEffect(() => {
    const timer = setTimeout(reportLayout, 0);
    return () => clearTimeout(timer);
  }, [reportLayout]);

  const currentTeamColor =
    currentTeam === Team.One
      ? theme.colorTheme.TEAM_ONE_COLOR
      : theme.colorTheme.TEAM_TWO_COLOR;

  const [rowStr, colStr] = id.split("-");
  const row = parseInt(rowStr, 10);
  const col = parseInt(colStr, 10);
  const rotation =
    row === 0 ? "90deg" : row === 8 ? "270deg" : col === 0 ? "0deg" : "180deg";

  const slotCoord = useMemo(() => keyToCoord(id), [id]);
  const isInaccessible =
    getSlotEntryDirection(slotCoord) === tutorialInaccessibleSlotEntryDirection;
  const isBlocked = useMemo(() => {
    if (isInaccessible) return true;
    if (resolveSlotDrop(gameState.board, slotCoord) !== null) return false;
    return getFirstOccupiedInSlotPath(gameState.board, slotCoord) !== null;
  }, [gameState.board, isInaccessible, slotCoord]);

  const slotDiscColor = isBlocked
    ? theme.colorTheme.BLOCKED_SLOT_BG_COLOR
    : theme.colorTheme.PIECE_TO_SLOT_COLOR;
  const arrowFillColor = isBlocked
    ? theme.colorTheme.BLOCKED_SLOT_ARROW_COLOR
    : currentTeamColor;

  return (
    <View
      ref={viewRef}
      style={{
        ...GameElements.SLOT_STYLE,
        borderWidth: 0,
        transform: [{ rotate: rotation }],
      }}
    >
      <View
        style={{
          position: "absolute",
          width: 36,
          height: 36,
          borderRadius: 14,
          backgroundColor: slotDiscColor,
          zIndex: 0,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 18,
          height: 8,
          marginEnd: 2,
          borderRadius: 14,
          backgroundColor: arrowFillColor,
        }}
      />
      <Image
        source={slotArrowClear}
        style={{
          width: 24,
          height: 24,
          resizeMode: "contain",
          zIndex: 1,
        }}
      />
    </View>
  );
};

export default Slot;
