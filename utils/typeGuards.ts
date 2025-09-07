import { Board } from "@/types";
import { CellLayout } from "@/types/board";

type SlotWithLayout = (
  | {
      id: string;
      layout: Board.CellLayout;
      type: Board.CellType.Slot;
    }[]
  | {
      id: string;
      layout: Board.CellLayout;
      type: Board.CellType.Space;
    }[]
  | Board.CellProps[]
)[number] & { layout: CellLayout };

export function hasLayout(slot?: {
  layout?: CellLayout;
}): slot is SlotWithLayout {
  return !!slot?.layout;
}
