import { Team } from "@/engine";
import { CellLayout, CellProps, CellType, EachCellType } from "@/types/board";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { computeBoardLighting } from "./boardGeometry";
import { createSelectorContext } from "./selectorContext";
type LayoutState = {
  wells: Record<Team, Record<string, CellLayout>>;
  spaces: Record<string, CellLayout>;
  slots: Record<string, CellLayout>;
  corners: Record<string, CellLayout>;
};
export type LayoutContextType = LayoutState & {
  layoutReady: boolean;
  registerCell: (cell: CellProps) => void;
  cellsByTeam: Record<Team, EachCellType[]>;
  shadowSun: ReturnType<typeof computeBoardLighting>;
};
const LayoutContext = createSelectorContext<LayoutContextType>("useLayout");
export const useLayoutSelector = LayoutContext.useSelector;
export const useLayout = () => useLayoutSelector(value => value);
const equalLayout = (a: CellLayout | undefined, b: CellLayout) => a && a.pageX === b.pageX && a.pageY === b.pageY && a.width === b.width && a.height === b.height;
export const LayoutProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [state, setState] = useState<LayoutState>({
    wells: {
      [Team.One]: {},
      [Team.Two]: {}
    },
    spaces: {},
    slots: {},
    corners: {}
  });
  const pending = useRef(new Map<string, CellProps>());
  const frame = useRef<number | null>(null);
  const registerCell = useCallback((cell: CellProps) => {
    if (!cell.layout) return;
    if (cell.type === CellType.Well && !cell.team) throw new Error("Well must have a team");
    pending.current.set(`${cell.type}:${cell.team ?? ""}:${cell.id}`, cell);
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const cells = [...pending.current.values()];
      pending.current.clear();
      setState(previous => {
        let next = previous;
        for (const {
          id,
          type,
          team,
          layout
        } of cells) {
          if (!layout) continue;
          if (type === CellType.Well && team) {
            if (equalLayout(next.wells[team]?.[id], layout)) continue;
            next = {
              ...next,
              wells: {
                ...next.wells,
                [team]: {
                  ...next.wells[team],
                  [id]: layout
                }
              }
            };
          } else {
            const key = type === CellType.Space ? "spaces" : type === CellType.Slot ? "slots" : "corners";
            if (equalLayout(next[key][id], layout)) continue;
            next = {
              ...next,
              [key]: {
                ...next[key],
                [id]: layout
              }
            };
          }
        }
        return next;
      });
    });
  }, []);
  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    pending.current.clear();
  }, []);
  const {
    spaces,
    slots,
    corners,
    wells
  } = state;
  const shadowSun = useMemo(() => computeBoardLighting(spaces), [spaces]);
  const cellsByTeam = useMemo(() => {
    const shared: EachCellType[] = [...Object.entries(slots).map(([id, layout]) => ({
      id,
      layout,
      type: CellType.Slot as const
    })), ...Object.entries(spaces).map(([id, layout]) => ({
      id,
      layout,
      type: CellType.Space as const
    }))];
    const forTeam = (team: Team) => [...shared, ...Object.entries(wells[team]).map(([id, layout]) => ({
      id,
      layout,
      team,
      type: CellType.Well as const
    }))];
    return {
      [Team.One]: forTeam(Team.One),
      [Team.Two]: forTeam(Team.Two)
    };
  }, [slots, spaces, wells]);
  const layoutReady = Object.keys(slots).length > 0 && Object.keys(spaces).length > 0 && Object.keys(corners).length > 0 && Object.keys(wells[Team.One]).length > 0 && Object.keys(wells[Team.Two]).length > 0;
  const value = useMemo(() => ({
    ...state,
    layoutReady,
    registerCell,
    shadowSun,
    cellsByTeam
  }), [state, layoutReady, registerCell, shadowSun, cellsByTeam]);
  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};
