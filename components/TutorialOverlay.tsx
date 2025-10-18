import React from "react";
import { Dimensions, View } from "react-native";

export type HighlightRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type TutorialOverlayProps = {
  visible: boolean;
  highlights: HighlightRect[];
  dimColor?: string;
};

const TutorialOverlay = ({
  visible,
  highlights,
  dimColor = "rgba(0,0,0,0.55)",
}: TutorialOverlayProps) => {
  const { width: screenW, height: screenH } = Dimensions.get("window");

  const dimRects = React.useMemo(() => {
    const ys = new Set<number>();
    ys.add(0);
    ys.add(screenH);
    highlights.forEach((r) => {
      ys.add(Math.max(0, r.y));
      ys.add(Math.min(screenH, r.y + r.height));
    });
    const yBounds = Array.from(ys).sort((a, b) => a - b);

    const rects: HighlightRect[] = [];
    for (let i = 0; i < yBounds.length - 1; i++) {
      const y1 = yBounds[i];
      const y2 = yBounds[i + 1];
      if (y2 <= y1) continue;
      const bandMidY = (y1 + y2) / 2;
      const active = highlights
        .filter((r) => bandMidY >= r.y && bandMidY <= r.y + r.height)
        .sort((a, b) => a.x - b.x);

      const xs = new Set<number>();
      xs.add(0);
      xs.add(screenW);
      active.forEach((r) => {
        xs.add(Math.max(0, r.x));
        xs.add(Math.min(screenW, r.x + r.width));
      });
      const xBounds = Array.from(xs).sort((a, b) => a - b);

      for (let j = 0; j < xBounds.length - 1; j++) {
        const x1 = xBounds[j];
        const x2 = xBounds[j + 1];
        if (x2 <= x1) continue;
        const midX = (x1 + x2) / 2;
        const inside = active.some((r) => midX >= r.x && midX <= r.x + r.width);
        if (!inside) {
          rects.push({ x: x1, y: y1, width: x2 - x1, height: y2 - y1 });
        }
      }
    }
    return rects;
  }, [highlights, screenW, screenH]);

  if (!visible) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1500,
      }}
    >
      {dimRects.map((r, idx) => (
        <View
          key={`dim-${idx}`}
          pointerEvents="auto"
          style={{
            position: "absolute",
            top: r.y,
            left: r.x,
            width: r.width,
            height: r.height,
            backgroundColor: dimColor,
          }}
        />
      ))}
    </View>
  );
};

export default TutorialOverlay;
