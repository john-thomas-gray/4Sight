import { CellLayout } from "@/types/board";
import { GameMode, Turn } from "@/types/logic";

export interface LayoutCells {
  wells: Record<string, Record<string, CellLayout>>;
  slots: Record<string, CellLayout>;
  spaces: Record<string, CellLayout>;
}

export interface EarlyEnableTimeoutProps {
  moveType: "slot" | "space" | "gravity";
  gameMode: GameMode;
  playersTurn: Turn;
  setTurnEnabledEarly: React.Dispatch<React.SetStateAction<Turn | undefined>>;
}
