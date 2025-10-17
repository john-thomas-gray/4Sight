import { GameElements } from "@/constants";
import { useGameContext } from "@/context/GameContext";
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
  const { layout, settings } = useGameContext();

  const slotLayout = layout.slots[id];
  if (!slotLayout) return null;

  const rotation = getRotationForSlot(id);
  const fillColor =
    settings.theme?.colorTheme?.SLOT_FOREGROUND_COLOR || "#6E2C00";
  const borderColor =
    settings.theme?.colorTheme?.SLOT_BORDER_COLOR || "#C0C0C0";

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: slotLayout.pageX,
        top: slotLayout.pageY,
        width: slotLayout.width,
        height: slotLayout.height,
        zIndex: 1200, // above default piece (500), below held piece (5000)
        transform: [{ rotate: rotation }],
      }}
    >
      <Svg height="40" width="40">
        <Mask id="slotrim-mask">
          <Rect x="0" y="0" width="40" height="40" fill="white" />
          <Circle cx="20" cy="20" r="16" fill="black" />
        </Mask>
        <Rect
          x="0"
          y="0"
          width="40"
          height="40"
          fill={fillColor}
          mask="url(#slotrim-mask)"
        />
        <Rect
          x="0"
          y="0"
          width="40"
          height="40"
          fill="none"
          stroke={borderColor}
          strokeWidth={GameElements.SLOT_BORDER_WIDTH}
        />
      </Svg>
    </View>
  );
};

export default memo(SlotRim);
