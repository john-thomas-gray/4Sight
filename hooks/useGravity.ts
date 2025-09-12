import { useGameContext } from "@/context/GameContext";
import { Direction } from "@/types/board";

type GravityProps = {
  direction: Direction.Up | Direction.Down | Direction.Left | Direction.Right;
};

const moveLog = ({
  pieceId,
  currentSpaceId,
  targetSpaceId,
}: {
  pieceId: string;
  currentSpaceId: string;
  targetSpaceId: string;
}) => {
  console.log(`Moving ${pieceId} from ${currentSpaceId} to ${targetSpaceId}`);
};

export const useGravity = () => {
  const { layout, logic } = useGameContext();
  const applyGravity = (direction: GravityProps["direction"]) => {
    // Don't apply gravity if a move is already in progress
    if (logic.moveInProgress) {
      return;
    }

    const updatedPieceLocations = { ...layout.boardPieceLocations };
    let hasMoves = false;

    if (direction === Direction.Up) {
      for (let row = 2; row <= 7; row++) {
        for (let col = 1; col <= 7; col++) {
          const currentSpaceId = `${row}-${col}`;

          if (updatedPieceLocations[currentSpaceId]) {
            const pieceId = updatedPieceLocations[currentSpaceId];
            let targetRow = row;
            while (
              targetRow > 1 &&
              !updatedPieceLocations[`${targetRow - 1}-${col}`]
            ) {
              targetRow--;
            }

            const targetSpaceId = `${targetRow}-${col}`;
            if (targetSpaceId !== currentSpaceId) {
              hasMoves = true;
              // moveLog({ currentSpaceId, targetSpaceId, pieceId });
              updatedPieceLocations[targetSpaceId] =
                updatedPieceLocations[currentSpaceId];
              delete updatedPieceLocations[currentSpaceId];
            }
          }
        }
      }
    } else if (direction === Direction.Down) {
      for (let row = 6; row >= 1; row--) {
        for (let col = 1; col <= 7; col++) {
          const currentSpaceId = `${row}-${col}`;
          if (updatedPieceLocations[currentSpaceId]) {
            const pieceId = updatedPieceLocations[currentSpaceId];
            let targetRow = row;
            while (
              targetRow < 7 &&
              !updatedPieceLocations[`${targetRow + 1}-${col}`]
            ) {
              targetRow++;
            }
            const targetSpaceId = `${targetRow}-${col}`;
            if (targetSpaceId !== currentSpaceId) {
              hasMoves = true;
              // moveLog({ currentSpaceId, targetSpaceId, pieceId });
              updatedPieceLocations[targetSpaceId] =
                updatedPieceLocations[currentSpaceId];
              delete updatedPieceLocations[currentSpaceId];
            }
          }
        }
      }
    } else if (direction === Direction.Left) {
      for (let col = 2; col <= 7; col++) {
        for (let row = 1; row <= 7; row++) {
          const currentSpaceId = `${row}-${col}`;
          if (updatedPieceLocations[currentSpaceId]) {
            const pieceId = updatedPieceLocations[currentSpaceId];
            let targetCol = col;
            while (
              targetCol > 1 &&
              !updatedPieceLocations[`${row}-${targetCol - 1}`]
            ) {
              targetCol--;
            }

            const targetSpaceId = `${row}-${targetCol}`;
            if (targetSpaceId !== currentSpaceId) {
              hasMoves = true;
              // moveLog({ currentSpaceId, targetSpaceId, pieceId });
              updatedPieceLocations[targetSpaceId] =
                updatedPieceLocations[currentSpaceId];
              delete updatedPieceLocations[currentSpaceId];
            }
          }
        }
      }
    } else if (direction === Direction.Right) {
      for (let col = 6; col >= 1; col--) {
        for (let row = 1; row <= 7; row++) {
          const currentSpaceId = `${row}-${col}`;
          if (updatedPieceLocations[currentSpaceId]) {
            const pieceId = updatedPieceLocations[currentSpaceId];
            let targetCol = col;
            while (
              targetCol < 7 &&
              !updatedPieceLocations[`${row}-${targetCol + 1}`]
            ) {
              targetCol++;
            }

            const targetSpaceId = `${row}-${targetCol}`;
            if (targetSpaceId !== currentSpaceId) {
              hasMoves = true;
              // moveLog({ currentSpaceId, targetSpaceId, pieceId });
              updatedPieceLocations[targetSpaceId] =
                updatedPieceLocations[currentSpaceId];
              delete updatedPieceLocations[currentSpaceId];
            }
          }
        }
      }
    } else {
      console.error("Invalid direction for gravity:", direction);
      return;
    }

    // Only apply gravity if there are actual moves to make
    if (!hasMoves) {
      return;
    }

    // Set move in progress to prevent other pieces from moving
    logic.setMoveInProgress(true);

    layout.setBoardPieceLocations(updatedPieceLocations);

    // Reset move in progress after gravity completes
    logic.setMoveInProgress(false);
  };
  return applyGravity;
};
