import { resolveSlotDrop, isSlot, keyToCoord, coordToKey } from "@/engine";
import type { Coord } from "@/engine";

export type DropTarget =
  | { kind: "slot"; slotCoord: Coord; landingCoord: Coord; landingKey: string }
  | { kind: "space"; coord: Coord; key: string }
  | { kind: "well"; wellId: string }
  | { kind: "miss" };

/**
 * Given a cell ID the piece was dropped on, determines what type of drop
 * it is and resolves the landing position using the engine.
 *
 * Slot drops: resolve via engine's slot-drop logic.
 * Space drops: validate the space is reachable and unoccupied.
 * Well drops: return to a well cell.
 * Miss: dropped outside any cell.
 */
export function resolveDropTarget(
  cellId: string,
  board: Readonly<Record<string, string>>,
  slotIds: Record<string, unknown>,
  spaceIds: Record<string, unknown>,
  wellIds: Record<string, unknown>,
): DropTarget {
  const coord = keyToCoord(cellId);

  if (cellId in slotIds && isSlot(coord)) {
    const landing = resolveSlotDrop(board, coord);
    if (!landing) {
      return { kind: "miss" };
    }
    return {
      kind: "slot",
      slotCoord: coord,
      landingCoord: landing,
      landingKey: coordToKey(landing),
    };
  }

  if (cellId in spaceIds) {
    if (board[cellId] !== undefined) {
      return { kind: "miss" };
    }
    return { kind: "space", coord, key: cellId };
  }

  if (cellId in wellIds) {
    return { kind: "well", wellId: cellId };
  }

  return { kind: "miss" };
}
