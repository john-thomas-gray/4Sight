import React, { ReactNode } from "react";
import { LayoutProvider, useLayout } from "./LayoutContext";
import { LogicProvider } from "./LogicContext";
import { SettingsProvider, useSettings } from "./SettingsContext";

type GameContextType = {
  settings: ReturnType<typeof useSettings>;
  layout: ReturnType<typeof useLayout>;
};
export type Settings = GameContextType["settings"];

export const GameProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <LayoutProvider>
      <LogicProvider>
        <SettingsProvider>{children}</SettingsProvider>
      </LogicProvider>
    </LayoutProvider>
  );
};

export const useGameContext = (): GameContextType => {
  const settings = useSettings();
  const layout = useLayout();

  return {
    settings,
    layout,
  };
};
