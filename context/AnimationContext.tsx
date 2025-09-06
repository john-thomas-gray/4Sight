import { usePieceAnimations } from "@/utils/usePieceAnimations";
import React, { createContext, useContext } from "react";

import { SharedValue } from "react-native-reanimated";

type PieceAnimation = {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  scaleX: SharedValue<number>;
  scaleY: SharedValue<number>;
  skewX: SharedValue<string>;
  skewY: SharedValue<string>;
  rotation: SharedValue<number>;
};

type AnimationContextType = {
  pieces: Record<number, PieceAnimation>;
};

const AnimationContext = createContext<AnimationContextType | null>(null);

export const AnimationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pieces = usePieceAnimations();

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
