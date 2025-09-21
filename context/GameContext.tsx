import React, { ReactNode } from "react";
import { LayoutProvider, useLayout } from "./LayoutContext";
import { LogicProvider, useLogic } from "./LogicContext";
import { SettingsProvider, useSettings } from "./SettingsContext";

type GameContextType = {
  settings: ReturnType<typeof useSettings>;
  layout: ReturnType<typeof useLayout>;
  logic: ReturnType<typeof useLogic>;
};
export type Settings = GameContextType["settings"];
export type Layout = GameContextType["layout"];
export type Logic = GameContextType["logic"];

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
  const logic = useLogic();

  return {
    settings,
    layout,
    logic,
  };
};
