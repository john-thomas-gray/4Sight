import React from "react";
import { act, render } from "@testing-library/react-native";
import { LayoutProvider, useLayout } from "../LayoutContext";
import { CellType } from "@/types/board";

it("batches measurements and does not republish identical geometry", () => {
  jest.useFakeTimers();
  let layout!: ReturnType<typeof useLayout>;
  const rendered = jest.fn();
  function Probe() { layout = useLayout(); rendered(); return null; }
  const view = render(<LayoutProvider><Probe /></LayoutProvider>);
  const cell = { pageX: 0, pageY: 0, width: 40, height: 40 };
  rendered.mockClear();
  act(() => {
    layout.registerCell({ id: "1-1", type: CellType.Space, layout: cell });
    layout.registerCell({ id: "1-2", type: CellType.Space, layout: { ...cell, pageX: 40 } });
    layout.registerCell({ id: "0-1", type: CellType.Slot, layout: { ...cell, pageY: -40 } });
    jest.advanceTimersByTime(20);
  });
  expect(rendered).toHaveBeenCalledTimes(1);
  const spaces = layout.spaces;
  const targets = layout.cellsByTeam;
  rendered.mockClear();
  act(() => {
    layout.registerCell({ id: "1-1", type: CellType.Space, layout: { ...cell } });
    jest.advanceTimersByTime(20);
  });
  expect(rendered).not.toHaveBeenCalled();
  expect(layout.spaces).toBe(spaces);
  expect(layout.cellsByTeam).toBe(targets);
  view.unmount();
  jest.useRealTimers();
});
