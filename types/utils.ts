import { LayoutContextType } from "@/context/LayoutContext";
import { CellLayout, EachCellType } from "@/types/board";
import { GameMode, PieceStatus, Turn } from "@/types/logic";

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

export type Coordinates = { x: number; y: number };

export type DetectHoverProps = {
  pieceStatus: PieceStatus;
  allCells: EachCellType[];
  adjustedPointerCoordinates: Coordinates;
  layout: LayoutContextType;
  boardPieceLocationsValue: Record<string, string>;
  setHover: (spaceId: string | null) => void;
};
