import React, { ReactNode } from "react";
import { LayoutProvider, useLayout } from "./LayoutContext";
import { LogicProvider } from "./LogicContext";
import { SettingsProvider, useSettings } from "./SettingsContext";

/* !@# GameContext should only be around gameplay.ts. Only pass the
savedState object up to the menu when you return to the menu mid game.
No need to have entire game running when it's not being played. This way,
new game will create a new game automatically on mount, and continue can
set up the game based on the savedState object */

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
