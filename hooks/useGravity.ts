import { useGameContext } from "@/context/GameContext";

type GravityProps = {
  direction: "up" | "down" | "left" | "right";
};

export const useGravity = () => {
  const { boardPieceLocations, setBoardPieceLocations } = useGameContext();
  console.log("board piece locations", boardPieceLocations);

  const applyGravity = (direction: GravityProps["direction"]) => {
    const updatedLocations = { ...boardPieceLocations };
    console.log("starting locations", updatedLocations);

    if (direction === "up") {
      for (let row = 2; row <= 7; row++) {
        for (let col = 1; col <= 7; col++) {
          const pieceLocationId = `${row}-${col}`;

          if (updatedLocations[pieceLocationId]) {
            const pieceId = updatedLocations[pieceLocationId];
            let targetRow = row;
            while (
              targetRow > 1 &&
              !updatedLocations[`${targetRow - 1}-${col}`]
            ) {
              targetRow--;
            }

            const targetId = `${targetRow}-${col}`;
            if (targetId !== pieceLocationId) {
              console.log(
                `Moving piece ${pieceId} from ${pieceLocationId} to ${targetId}`
              );
              updatedLocations[targetId] = updatedLocations[pieceLocationId];
              delete updatedLocations[pieceLocationId];
            }
          }
        }
      }
    } else if (direction === "down") {
      for (let row = 6; row >= 1; row--) {
        for (let col = 1; col <= 7; col++) {
          const pieceLocationId = `${row}-${col}`;
          if (updatedLocations[pieceLocationId]) {
            const pieceId = updatedLocations[pieceLocationId];
            let targetRow = row;
            while (
              targetRow < 7 &&
              !updatedLocations[`${targetRow + 1}-${col}`]
            ) {
              targetRow++;
            }
            const targetId = `${targetRow}-${col}`;
            if (targetId !== pieceLocationId) {
              console.log(
                `Moving piece ${pieceId} from ${pieceLocationId} to ${targetId}`
              );
              updatedLocations[targetId] = updatedLocations[pieceLocationId];
              delete updatedLocations[pieceLocationId];
            }
          }
        }
      }
    } else if (direction === "left") {
      for (let col = 2; col <= 7; col++) {
        for (let row = 1; row <= 7; row++) {
          const pieceLocationId = `${row}-${col}`;
          if (updatedLocations[pieceLocationId]) {
            const pieceId = updatedLocations[pieceLocationId];
            let targetCol = col;
            while (
              targetCol > 1 &&
              !updatedLocations[`${row}-${targetCol - 1}`]
            ) {
              targetCol--;
            }

            const targetId = `${row}-${targetCol}`;
            if (targetId !== pieceLocationId) {
              console.log(
                `Moving piece ${pieceId} from ${pieceLocationId} to ${targetId}`
              );
              updatedLocations[targetId] = updatedLocations[pieceLocationId];
              delete updatedLocations[pieceLocationId];
            }
          }
        }
      }
    } else if (direction === "right") {
      for (let col = 6; col >= 1; col--) {
        for (let row = 1; row <= 7; row++) {
          const pieceLocationId = `${row}-${col}`;
          if (updatedLocations[pieceLocationId]) {
            const pieceId = updatedLocations[pieceLocationId];
            let targetCol = col;
            while (
              targetCol < 7 &&
              !updatedLocations[`${row}-${targetCol + 1}`]
            ) {
              targetCol++;
            }

            const targetId = `${row}-${targetCol}`;
            if (targetId !== pieceLocationId) {
              console.log(
                `Moving piece from ${pieceLocationId} to ${targetId}`
              );
              updatedLocations[targetId] = updatedLocations[pieceLocationId];
              delete updatedLocations[pieceLocationId];
            }
          }
        }
      }
    } else {
      console.error("Invalid direction for gravity:", direction);
      return;
    }

    setBoardPieceLocations(updatedLocations);
    console.log("Updated boardPieceLocations:", updatedLocations);
  };

  return applyGravity;
};
