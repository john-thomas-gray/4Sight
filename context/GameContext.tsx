import React, { ReactNode } from "react";

import { LayoutProvider, useLayoutContext } from "./LayoutContext";
import { LogicProvider, useLogicContext } from "./LogicContext";
import { SettingsProvider, useSettingsContext } from "./SettingsContext";

type GameContextType = {
  settings: ReturnType<typeof useSettingsContext>;
  layout: ReturnType<typeof useLayoutContext>;
  logic: ReturnType<typeof useLogicContext>;
};
export type Settings = GameContextType["settings"];
export type Layout = GameContextType["layout"];
export type Logic = GameContextType["logic"];
// This provider just nests the other three providers
export const GameProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <SettingsProvider>
      <LayoutProvider>
        <LogicProvider>{children}</LogicProvider>
      </LayoutProvider>
    </SettingsProvider>
  );
};

// Hook to access all three contexts together
export const useGameContext = (): GameContextType => {
  const settings = useSettingsContext();
  const layout = useLayoutContext();
  const logic = useLogicContext();

  return {
    settings,
    layout,
    logic,
  };
};
