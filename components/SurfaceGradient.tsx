import React, { memo, useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

type SurfaceGradientProps = {
  variant?: "background" | "raised" | "board";
  borderRadius?: number;
};

const finishes = {
  background: { highlight: 0.07, shade: 0.18 },
  raised: { highlight: 0.14, shade: 0.08 },
  board: { highlight: 0.06, shade: 0.07 },
};

/** Decorative lighting that preserves the underlying theme and touch targets. */
const SurfaceGradient = ({
  variant = "background",
  borderRadius = 0,
}: SurfaceGradientProps) => {
  const gradientId = useId();
  const { highlight, shade } = finishes[variant];

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      aria-hidden
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient
            id={gradientId}
            x1="0%"
            y1="0%"
            x2={variant === "raised" ? "0%" : "100%"}
            y2="100%"
          >
            <Stop offset="0%" stopColor="#ffffff" stopOpacity={highlight} />
            <Stop offset="45%" stopColor="#ffffff" stopOpacity={0} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={shade} />
          </LinearGradient>
        </Defs>
        <Rect
          width="100%"
          height="100%"
          rx={borderRadius}
          fill={`url(#${gradientId})`}
        />
      </Svg>
    </View>
  );
};

export default memo(SurfaceGradient);
