import { useGameContext } from "@/context/GameContext";
import React, { memo, useMemo } from "react";
import { View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

const Glass: React.FC = () => {
  const { layout } = useGameContext();

  const bounds = useMemo(() => {
    const spaceLayouts = Object.values(layout.spaces || {});
    if (spaceLayouts.length === 0) return null;
    const minX = Math.min(...spaceLayouts.map((s) => s.pageX));
    const minY = Math.min(...spaceLayouts.map((s) => s.pageY));
    const maxX = Math.max(...spaceLayouts.map((s) => s.pageX + s.width));
    const maxY = Math.max(...spaceLayouts.map((s) => s.pageY + s.height));
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }, [layout.spaces]);

  if (!bounds) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
        zIndex: 1200,
        opacity: 0.96,
      }}
    >
      <Svg width={bounds.width} height={bounds.height}>
        <Defs>
          <LinearGradient id="glass-grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#fff" stopOpacity="0.28" />
            <Stop offset="35%" stopColor="#fff" stopOpacity="0.10" />
            <Stop offset="55%" stopColor="#fff" stopOpacity="0.05" />
            <Stop offset="100%" stopColor="#fff" stopOpacity="0.14" />
          </LinearGradient>
          <LinearGradient id="specular" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#fff" stopOpacity="0.0" />
            <Stop offset="20%" stopColor="#fff" stopOpacity="0.25" />
            <Stop offset="40%" stopColor="#fff" stopOpacity="0.0" />
          </LinearGradient>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={bounds.width}
          height={bounds.height}
          fill="#fff"
          opacity={0.05}
        />
        <Rect
          x={0}
          y={0}
          width={bounds.width}
          height={bounds.height}
          fill="url(#glass-grad)"
        />
        <Rect
          x={0}
          y={0}
          width={bounds.width}
          height={2}
          fill="#fff"
          opacity={0.18}
        />
        <Rect
          x={bounds.width * 0.15}
          y={0}
          width={bounds.width * 0.12}
          height={bounds.height}
          fill="url(#specular)"
        />
        <Rect
          x={0.5}
          y={0.5}
          width={bounds.width - 1}
          height={bounds.height - 1}
          fill="none"
          stroke="#fff"
          opacity={0.06}
        />
      </Svg>
    </View>
  );
};

export default memo(Glass);
