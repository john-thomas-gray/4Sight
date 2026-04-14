import { GameElements } from "@/constants";
import { useLayout } from "@/context/LayoutContext";
import { useSettings } from "@/context/SettingsContext";
import React, { memo } from "react";
import { View } from "react-native";
import Svg, { Circle, Mask, Rect } from "react-native-svg";

type Props = {
  id: string;
};

const getRotationForSlot = (id: string) => {
  const [row, col] = id.split("-").map(Number);
  return row === 8
    ? "270deg"
    : row === 0
      ? "90deg"
      : col === 0
        ? "0deg"
        : "180deg";
};

const SlotRim: React.FC<Props> = ({ id }) => {
  const layout = useLayout();
  const { theme } = useSettings();
  const slotLayout = layout.slots[id];
  if (!slotLayout) return null;

  const rotation = getRotationForSlot(id);

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: slotLayout.pageX,
        top: slotLayout.pageY,
        width: slotLayout.width,
        height: slotLayout.height,
        zIndex: 1200,
        transform: [{ rotate: rotation }],
      }}
    >
      <Svg height="40" width="40">
        <Mask id={`slotrim-mask-${id}`}>
          <Rect x="0" y="0" width="40" height="40" fill="white" />
          <Circle cx="20" cy="20" r="16" fill="black" />
        </Mask>
        <Rect
          x="0"
          y="0"
          width="40"
          height="40"
          fill={theme.colorTheme.SLOT_FOREGROUND_COLOR}
          mask={`url(#slotrim-mask-${id})`}
        />
        <Rect
          x="0"
          y="0"
          width="40"
          height="40"
          fill="none"
          stroke={theme.colorTheme.SLOT_BORDER_COLOR}
          strokeWidth={GameElements.SLOT_BORDER_WIDTH}
        />
      </Svg>
    </View>
  );
};

export default memo(SlotRim);
