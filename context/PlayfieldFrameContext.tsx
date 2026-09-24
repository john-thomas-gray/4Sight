import type { CellLayout } from "@/types/board";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";
import type { RefObject } from "react";
import { View } from "react-native";
import { useSharedValue, type SharedValue } from "react-native-reanimated";

/** Stable ref used when measuring outside a playfield (e.g. tests). */
export const EMPTY_PLAYFIELD_REF: RefObject<View | null> = { current: null };

type PlayfieldFrameContextValue = {
  windowOrigin: SharedValue<{ x: number; y: number }>;
  playfieldRef: React.RefObject<View | null>;
  windowOriginRef: React.MutableRefObject<{ x: number; y: number }>;
};

const PlayfieldFrameContext = createContext<PlayfieldFrameContextValue | null>(
  null,
);

/**
 * Lays out cells and overlays in coordinates relative to the playfield wrapper
 * so the board, wells, slot rims, and pieces move together when flex layout shifts.
 */
export function PlayfieldFrameProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const playfieldRef = useRef<View>(null);
  const windowOriginRef = useRef({ x: 0, y: 0 });
  const windowOrigin = useSharedValue({ x: 0, y: 0 });

  const syncWindowOrigin = useCallback(() => {
    playfieldRef.current?.measureInWindow((x, y) => {
      windowOriginRef.current = { x, y };
      windowOrigin.value = { x, y };
    });
  }, [windowOrigin]);

  const value = useMemo(
    () => ({ playfieldRef, windowOriginRef, windowOrigin }),
    [windowOrigin],
  );

  return (
    <PlayfieldFrameContext.Provider value={value}>
      <View
        ref={playfieldRef}
        collapsable={false}
        onLayout={syncWindowOrigin}
        style={{ position: "relative", alignItems: "center" }}
      >
        {children}
      </View>
    </PlayfieldFrameContext.Provider>
  );
}

export function usePlayfieldFrameOptional(): PlayfieldFrameContextValue | null {
  return useContext(PlayfieldFrameContext);
}

export function measureLayoutRelativeToPlayfield(
  elementRef: RefObject<View | null>,
  playfieldRef: RefObject<View | null>,
  onMeasured: (layout: CellLayout) => void,
): void {
  const el = elementRef.current;
  if (!el) return;
  const field = playfieldRef.current;
  if (!field) {
    el.measure((x, y, width, height, pageX, pageY) => {
      onMeasured({ pageX, pageY, width, height });
    });
    return;
  }
  el.measureInWindow((px, py, pw, ph) => {
    field.measureInWindow((fx, fy) => {
      onMeasured({
        pageX: px - fx,
        pageY: py - fy,
        width: pw,
        height: ph,
      });
    });
  });
}
