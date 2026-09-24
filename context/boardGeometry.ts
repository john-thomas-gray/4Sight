import { GameElements } from "@/constants";
import type { CellLayout } from "@/types/board";
export function computeBoardLighting(spacesById: Record<string, CellLayout>) {
  const spaces = Object.values(spacesById);
  if (spaces.length === 0) {
    return {
      x: GameElements.BASE_CELL_SIZE * 9,
      y: GameElements.BASE_CELL_SIZE * 4.5,
      nearestDistance: GameElements.BASE_CELL_SIZE * 2,
      farthestDistance: GameElements.BASE_CELL_SIZE * 10
    };
  }
  const minX = Math.min(...spaces.map(space => space.pageX));
  const minY = Math.min(...spaces.map(space => space.pageY));
  const maxX = Math.max(...spaces.map(space => space.pageX + space.width));
  const maxY = Math.max(...spaces.map(space => space.pageY + space.height));
  const boardWidth = maxX - minX;
  const boardCenterY = minY + (maxY - minY) / 2;
  const sunX = maxX + boardWidth * 0.55;
  const sunY = boardCenterY;
  const nearestDistance = Math.max(1, sunX - maxX);
  const farthestVerticalDistance = Math.max(Math.abs(sunY - minY), Math.abs(maxY - sunY));
  const farthestDistance = Math.sqrt((sunX - minX) * (sunX - minX) + farthestVerticalDistance * farthestVerticalDistance);
  return {
    x: sunX,
    y: sunY,
    nearestDistance,
    farthestDistance
  };
}
