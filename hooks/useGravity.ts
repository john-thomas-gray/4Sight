import { GRAVITY_IN_PROGRESS } from "@/constants/animations";
import {
  useLogicBoardState,
  useLogicInteractions,
} from "@/context/LogicContext";
import { Direction } from "@/types/board";
import { useEffect, useRef } from "react";

type GravityProps = {
  direction: Direction.Up | Direction.Down | Direction.Left | Direction.Right;
};

export const useGravity = () => {
  const { boardPieceLocations, setBoardPieceLocations } = useLogicBoardState();
  const { moveInProgress, setMoveInProgress } = useLogicInteractions();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const applyGravity = (direction: GravityProps["direction"]) => {
    if (moveInProgress) {
      return;
    }
    console.log("applyGravity", direction);
    setMoveInProgress(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    timeoutRef.current = setTimeout(() => {
      setMoveInProgress(false);
      timeoutRef.current = null;
    }, GRAVITY_IN_PROGRESS);

    const updatedPieceLocations = { ...boardPieceLocations };
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

    setBoardPieceLocations(updatedPieceLocations);
  };
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);
  return applyGravity;
};
