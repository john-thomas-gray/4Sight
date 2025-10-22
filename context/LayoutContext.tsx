import { CellLayout, CellProps, CellType, Team } from "@/types/board";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

export type LayoutContextType = {
  wells: Record<Team, Record<string, CellLayout>>;
  spaces: Record<string, CellLayout>;
  slots: Record<string, CellLayout>;
  corners: Record<string, CellLayout>;
  layoutReady: boolean;
  registerCell: ({ id, type, team, layout }: CellProps) => void;
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [wells, setWells] = useState<Record<Team, Record<string, CellLayout>>>({
    [Team.TeamOne]: {},
    [Team.TeamTwo]: {},
    [Team.Both]: {},
    [Team.Unassigned]: {},
  });
  const [spaces, setSpaces] = useState<Record<string, CellLayout>>({});
  const [slots, setSlots] = useState<Record<string, CellLayout>>({});
  const [corners, setCorners] = useState<Record<string, CellLayout>>({});
  const layoutReady =
    Object.keys(slots).length > 0 &&
    Object.keys(spaces).length > 0 &&
    Object.keys(corners).length > 0 &&
    Object.keys(wells[Team.TeamOne]).length > 0 &&
    Object.keys(wells[Team.TeamTwo]).length > 0;

  const registerCell = useCallback(({ id, team, type, layout }: CellProps) => {
    if (!layout) return;

    switch (type) {
      case CellType.Slot:
        setSlots((prev) => ({ ...prev, [id]: layout }));
        break;
      case CellType.Space:
        setSpaces((prev) => ({ ...prev, [id]: layout }));
        break;
      case CellType.Well:
        if (!team) throw new Error("Well must have a team");
        setWells((prev) => ({
          ...prev,
          [team]: { ...prev[team], [id]: layout },
        }));
        break;
      case CellType.Corner:
        setCorners((prev) => ({ ...prev, [id]: layout }));
        break;
      default:
        throw new Error(`registerCell: unknown type "${type}"`);
    }
  }, []);

  return (
    <LayoutContext.Provider
      value={{
        wells,
        spaces,
        slots,
        corners,
        layoutReady,
        registerCell,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
};
