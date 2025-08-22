import { useGameContext } from "@/context/GameContext";

type GravityProps = {
  direction: "up" | "down" | "left" | "right";
};

export const useGravity = () => {
  const { boardPieceLocations, setBoardPieceLocations } = useGameContext();
  console.log("board piece locations", boardPieceLocations);

  const applyGravity = (direction: GravityProps["direction"]) => {
    const updatedPieceLocations = { ...boardPieceLocations };
    console.log("starting locations", updatedPieceLocations);

    if (direction === "up") {
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
              console.log(
                `Moving piece ${pieceId} from ${currentSpaceId} to ${targetSpaceId}`
              );
              updatedPieceLocations[targetSpaceId] =
                updatedPieceLocations[currentSpaceId];
              delete updatedPieceLocations[currentSpaceId];
            }
          }
        }
      }
    } else if (direction === "down") {
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
              console.log(
                `Moving piece ${pieceId} from ${currentSpaceId} to ${targetSpaceId}`
              );
              updatedPieceLocations[targetSpaceId] =
                updatedPieceLocations[currentSpaceId];
              delete updatedPieceLocations[currentSpaceId];
            }
          }
        }
      }
    } else if (direction === "left") {
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
              console.log(
                `Moving piece ${pieceId} from ${currentSpaceId} to ${targetSpaceId}`
              );
              updatedPieceLocations[targetSpaceId] =
                updatedPieceLocations[currentSpaceId];
              delete updatedPieceLocations[currentSpaceId];
            }
          }
        }
      }
    } else if (direction === "right") {
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
              console.log(
                `Moving ${pieceId} from ${currentSpaceId} to ${targetSpaceId}`
              );
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

    setBoardPieceLocations(updatedPieceLocations);
    console.log("Updated boardPieceLocations:", updatedPieceLocations);
  };

  return applyGravity;
};
