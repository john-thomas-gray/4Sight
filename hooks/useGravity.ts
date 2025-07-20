import { useGameContext } from "@/context/GameContext";

type GravityProps = {
  direction: "up" | "down" | "left" | "right";
};

export const useGravity = () => {
  const { boardPieceLocations, setBoardPieceLocations } = useGameContext();

  const applyGravity = (direction: GravityProps["direction"]) => {
    const updatedLocations = { ...boardPieceLocations };

    if (direction === "up") {
      for (let row = 2; row <= 7; row++) {
        for (let col = 1; col <= 7; col++) {
          const pieceId = `${row}-${col}`;
          if (updatedLocations[pieceId]) {
            let targetRow = row;
            while (
              targetRow > 1 &&
              !updatedLocations[`${targetRow - 1}-${col}`]
            ) {
              targetRow--;
            }

            const targetId = `${targetRow}-${col}`;
            if (targetId !== pieceId) {
              console.log(`Moving piece from ${pieceId} to ${targetId}`);
              updatedLocations[targetId] = updatedLocations[pieceId];
              delete updatedLocations[pieceId];
            }
          }
        }
      }
    } else if (direction === "down") {
      for (let row = 6; row >= 1; row--) {
        for (let col = 1; col <= 7; col++) {
          const pieceId = `${row}-${col}`;
          if (updatedLocations[pieceId]) {
            let targetRow = row;
            while (
              targetRow < 7 && // 🔒 don't go into row 8
              !updatedLocations[`${targetRow + 1}-${col}`]
            ) {
              targetRow++;
            }

            const targetId = `${targetRow}-${col}`;
            if (targetId !== pieceId) {
              console.log(`Moving piece from ${pieceId} to ${targetId}`);
              updatedLocations[targetId] = updatedLocations[pieceId];
              delete updatedLocations[pieceId];
            }
          }
        }
      }
    } else if (direction === "left") {
      for (let col = 2; col <= 7; col++) {
        for (let row = 1; row <= 7; row++) {
          const pieceId = `${row}-${col}`;
          if (updatedLocations[pieceId]) {
            let targetCol = col;
            while (
              targetCol > 1 && // 🔒 don't go into col 0
              !updatedLocations[`${row}-${targetCol - 1}`]
            ) {
              targetCol--;
            }

            const targetId = `${row}-${targetCol}`;
            if (targetId !== pieceId) {
              console.log(`Moving piece from ${pieceId} to ${targetId}`);
              updatedLocations[targetId] = updatedLocations[pieceId];
              delete updatedLocations[pieceId];
            }
          }
        }
      }
    } else if (direction === "right") {
      for (let col = 6; col >= 1; col--) {
        for (let row = 1; row <= 7; row++) {
          const pieceId = `${row}-${col}`;
          if (updatedLocations[pieceId]) {
            let targetCol = col;
            while (
              targetCol < 7 && // 🔒 don't go into col 8
              !updatedLocations[`${row}-${targetCol + 1}`]
            ) {
              targetCol++;
            }

            const targetId = `${row}-${targetCol}`;
            if (targetId !== pieceId) {
              console.log(`Moving piece from ${pieceId} to ${targetId}`);
              updatedLocations[targetId] = updatedLocations[pieceId];
              delete updatedLocations[pieceId];
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
