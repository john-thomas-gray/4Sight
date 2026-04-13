import React, { ReactNode } from "react";
import { CommerceProvider } from "./CommerceContext";
import { GameSessionProvider } from "./GameSessionContext";
import { LayoutProvider } from "./LayoutContext";
import { SettingsProvider } from "./SettingsContext";
import { UiProvider } from "./UiContext";

export const GameProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <SettingsProvider>
      <CommerceProvider>
        <UiProvider>
          <LayoutProvider>
            <GameSessionProvider>{children}</GameSessionProvider>
          </LayoutProvider>
        </UiProvider>
      </CommerceProvider>
    </SettingsProvider>
  );
};
