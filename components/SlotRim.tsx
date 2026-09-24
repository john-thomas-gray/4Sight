import { GameElements } from "@/constants";
import { useLayoutSelector } from "@/context/LayoutContext";
import { useSettings } from "@/context/SettingsContext";
import { useUiSelector } from "@/context/UiContext";
import React, { memo } from "react";
import { View } from "react-native";
import Animated, { useAnimatedProps } from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Mask, Rect, Stop } from "react-native-svg";

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
  const slotLayout = useLayoutSelector(layout => layout.slots[id]);
  const { theme } = useSettings();
  const slotRimOpeningScale = useUiSelector(ui => ui.slotRimOpeningScale);
  const animatedHoleProps = useAnimatedProps(() => ({
    r: MASK_INNER_R * slotRimOpeningScale.value,
  }));
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
        <Defs>
          <LinearGradient
            id={`slotrim-finish-${id}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.12} />
            <Stop offset="45%" stopColor="#ffffff" stopOpacity={0} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0.12} />
          </LinearGradient>
        </Defs>
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
          width="40"
          height="40"
          fill={`url(#slotrim-finish-${id})`}
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
