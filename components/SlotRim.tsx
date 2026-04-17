import { GameElements } from "@/constants";
import { useLayout } from "@/context/LayoutContext";
import { useSettings } from "@/context/SettingsContext";
import { useUi } from "@/context/UiContext";
import React, { memo } from "react";
import { View } from "react-native";
import Animated, { useAnimatedProps } from "react-native-reanimated";
import Svg, { Circle, Mask, Rect } from "react-native-svg";

const MASK_INNER_R = 16;
const MASK_CX = 20;
const MASK_CY = 20;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
  const { slotRimOpeningScale } = useUi();
  const slotLayout = layout.slots[id];
  if (!slotLayout) return null;

  const rotation = getRotationForSlot(id);

  const animatedHoleProps = useAnimatedProps(() => ({
    r: MASK_INNER_R * slotRimOpeningScale.value,
  }));

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
          <AnimatedCircle
            cx={MASK_CX}
            cy={MASK_CY}
            fill="black"
            animatedProps={animatedHoleProps}
          />
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
