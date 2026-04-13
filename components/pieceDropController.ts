import { resolveSlotDrop, isSlot, keyToCoord, coordToKey, findSlotForSpace } from "@/engine";
import type { Coord } from "@/engine";

export type DropTarget =
  | { kind: "slot"; slotCoord: Coord; landingCoord: Coord; landingKey: string }
  | { kind: "well"; wellId: string }
  | { kind: "miss" };

export type DropOutcome =
  | { kind: "placed"; slotCoord: Coord; landingKey: string }
  | { kind: "well"; wellId: string }
  | { kind: "returnToWell"; originWellId: string };

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
    const slot = findSlotForSpace(board, coord);
    if (!slot) {
      return { kind: "miss" };
    }
    const landing = resolveSlotDrop(board, slot);
    if (!landing) {
      return { kind: "miss" };
    }
    return {
      kind: "slot",
      slotCoord: slot,
      landingCoord: landing,
      landingKey: coordToKey(landing),
    };
  }

  if (cellId in wellIds) {
    return { kind: "well", wellId: cellId };
  }

  return { kind: "miss" };
}

/**
 * Resolves the final destination of a dropped piece by combining the
 * drop-target resolution with the well-occupancy check from PieceView.
 *
 * "placed"      → piece lands on a board space (via a slot).
 * "well"        → piece moves to a (possibly different) well cell.
 * "returnToWell"→ piece returns to its original well.
 */
export function resolveDropOutcome(
  cellId: string,
  board: Readonly<Record<string, string>>,
  slotIds: Record<string, unknown>,
  spaceIds: Record<string, unknown>,
  wellIds: Record<string, unknown>,
  wellPieceLocations: Readonly<Record<string, string>>,
  originWellId: string,
): DropOutcome {
  const target = resolveDropTarget(cellId, board, slotIds, spaceIds, wellIds);

  if (target.kind === "slot") {
    return { kind: "placed", slotCoord: target.slotCoord, landingKey: target.landingKey };
  }

  if (target.kind === "well" && wellPieceLocations[target.wellId] === undefined) {
    return { kind: "well", wellId: target.wellId };
  }

  return { kind: "returnToWell", originWellId };
}
