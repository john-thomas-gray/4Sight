import { GRAVITY_IN_PROGRESS } from "@/constants/animations";
import { useGameContext } from "@/context/GameContext";
import { Direction } from "@/types/board";
import earlyEnableTimeout from "@/utils/earlyEnableTimeout";

type GravityProps = {
  direction: Direction.Up | Direction.Down | Direction.Left | Direction.Right;
};

export const useGravity = () => {
  const { logic } = useGameContext();

  const applyGravity = (direction: GravityProps["direction"]) => {
    if (logic.moveInProgress) {
      return;
    }

    logic.setMoveInProgress(true);
    setTimeout(() => {
      logic.setMoveInProgress(false);
    }, GRAVITY_IN_PROGRESS);

    earlyEnableTimeout({
      moveType: "gravity",
      setEarlyPieceEnable: logic.setEarlyPieceEnable,
    });

    const updatedPieceLocations = { ...logic.boardPieceLocations };
    let hasMoves = false;
    if (direction === Direction.Up) {
      for (let row = 2; row <= 7; row++) {
        for (let col = 1; col <= 7; col++) {
          const currentSpaceId = `${row}-${col}`;

          if (updatedPieceLocations[currentSpaceId]) {
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

    logic.setBoardPieceLocations(updatedPieceLocations);
  };
  return applyGravity;
};
