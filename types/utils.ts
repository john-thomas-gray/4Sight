import { CellLayout } from "@/types/board";

export interface LayoutCells {
  wells: Record<string, Record<string, CellLayout>>;
  slots: Record<string, CellLayout>;
  spaces: Record<string, CellLayout>;
}
