import React, { ReactNode } from "react";

import { LayoutProvider, useLayoutContext } from "./LayoutContext";
import { LogicProvider, useLogicContext } from "./LogicContext";
import { SettingsProvider, useSettingsContext } from "./SettingsContext";

type MegaContextType = {
  settings: ReturnType<typeof useSettingsContext>;
  layout: ReturnType<typeof useLayoutContext>;
  logic: ReturnType<typeof useLogicContext>;
};
export type Settings = MegaContextType["settings"];
export type Layout = MegaContextType["layout"];
export type Logic = MegaContextType["logic"];
// This provider just nests the other three providers
export const MegaProvider: React.FC<{ children: ReactNode }> = ({
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
export const useMegaContext = (): MegaContextType => {
  const settings = useSettingsContext();
  const layout = useLayoutContext();
  const logic = useLogicContext();

  return {
    settings,
    layout,
    logic,
  };
};
