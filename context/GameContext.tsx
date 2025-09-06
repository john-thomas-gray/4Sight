import React, { ReactNode } from "react";

import { AnimationProvider, useAnimation } from "./AnimationContext";
import { LayoutProvider, useLayout } from "./LayoutContext";
import { LogicProvider, useLogic } from "./LogicContext";
import { SettingsProvider, useSettings } from "./SettingsContext";

type GameContextType = {
  settings: ReturnType<typeof useSettings>;
  layout: ReturnType<typeof useLayout>;
  logic: ReturnType<typeof useLogic>;
  animation: ReturnType<typeof useAnimation>;
};
export type Settings = GameContextType["settings"];
export type Layout = GameContextType["layout"];
export type Logic = GameContextType["logic"];

export const GameProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <SettingsProvider>
      <LayoutProvider>
        <LogicProvider>
          <AnimationProvider>{children}</AnimationProvider>
        </LogicProvider>
      </LayoutProvider>
    </SettingsProvider>
  );
};

export const useGameContext = (): GameContextType => {
  const settings = useSettings();
  const layout = useLayout();
  const logic = useLogic();
  const animation = useAnimation();
  return {
    settings,
    layout,
    logic,
    animation,
  };
};
