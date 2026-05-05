import {
  resolveSlotDrop,
  isSlot,
  keyToCoord,
  coordToKey,
  findSlotForSpace,
  getFirstOccupiedInSlotPath,
  getSlotEntryDirection,
} from "@/engine";
import type { Coord, Direction } from "@/engine";

type DropTarget =
  | { kind: "slot"; slotCoord: Coord; landingCoord: Coord; landingKey: string }
  | {
      kind: "blockedSlot";
      slotCoord: Coord;
      blockingPieceId: string;
      blockingKey: string;
      entryDirection: Direction;
    }
  | { kind: "well"; wellId: string }
  | { kind: "miss" };

type DropOutcome =
  | { kind: "placed"; slotCoord: Coord; landingKey: string }
  | {
      kind: "blockedSlot";
      slotCoord: Coord;
      blockingPieceId: string;
      blockingKey: string;
      entryDirection: Direction;
    }
  | { kind: "well"; wellId: string }
  | { kind: "returnToWell"; originWellId: string };

function resolveDropTarget(
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
      const block = getFirstOccupiedInSlotPath(board, coord);
      const dir = getSlotEntryDirection(coord);
      if (block && dir) {
        return {
          kind: "blockedSlot",
          slotCoord: coord,
          blockingPieceId: block.pieceId,
          blockingKey: coordToKey(block.coord),
          entryDirection: dir,
        };
      }
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
      const block = getFirstOccupiedInSlotPath(board, slot);
      const dir = getSlotEntryDirection(slot);
      if (block && dir) {
        return {
          kind: "blockedSlot",
          slotCoord: slot,
          blockingPieceId: block.pieceId,
          blockingKey: coordToKey(block.coord),
          entryDirection: dir,
        };
      }
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

  if (target.kind === "blockedSlot") {
    return {
      kind: "blockedSlot",
      slotCoord: target.slotCoord,
      blockingPieceId: target.blockingPieceId,
      blockingKey: target.blockingKey,
      entryDirection: target.entryDirection,
    };
  }

  if (target.kind === "slot") {
    return { kind: "placed", slotCoord: target.slotCoord, landingKey: target.landingKey };
  }

  if (target.kind === "well" && wellPieceLocations[target.wellId] === undefined) {
    return { kind: "well", wellId: target.wellId };
  }

  return { kind: "returnToWell", originWellId };
}
