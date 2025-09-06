import React, { createContext, useContext } from "react";

import { SharedValue, useSharedValue } from "react-native-reanimated";

import { INITIAL_PIECE_POSITIONS } from "@/constants/gameElements";
export type PieceAnimation = {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  scaleX?: SharedValue<number>;
  scaleY?: SharedValue<number>;
  skewX?: SharedValue<number>;
  skewY?: SharedValue<number>;
  rotation?: SharedValue<number>;
};

export const pieceAnimations = () => {
  const pieces: Record<
    string,
    {
      translateX: ReturnType<typeof useSharedValue<number>>;
      translateY: ReturnType<typeof useSharedValue<number>>;
      scaleX: ReturnType<typeof useSharedValue<number>>;
      scaleY: ReturnType<typeof useSharedValue<number>>;
      skewX: ReturnType<typeof useSharedValue<number>>;
      skewY: ReturnType<typeof useSharedValue<number>>;
      rotation: ReturnType<typeof useSharedValue<number>>;
    }
  > = {};

  Object.entries(INITIAL_PIECE_POSITIONS).forEach(([id, pos]) => {
    pieces[id] = {
      translateX: useSharedValue(pos.x),
      translateY: useSharedValue(pos.y),
      scaleX: useSharedValue(1),
      scaleY: useSharedValue(1),
      skewX: useSharedValue(0),
      skewY: useSharedValue(0),
      rotation: useSharedValue(0),
    };
  });

  return pieces;
};

type AnimationContextType = {
  pieces: Record<string, PieceAnimation>;
};

const AnimationContext = createContext<AnimationContextType | null>(null);

export const AnimationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pieces = pieceAnimations();

  return (
    <AnimationContext.Provider value={{ pieces }}>
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimation = () => {
  const ctx = useContext(AnimationContext);
  if (!ctx) {
    throw new Error("useAnimation must be used inside AnimationProvider");
  }
  return ctx;
};
