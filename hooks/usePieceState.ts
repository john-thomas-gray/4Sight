import { useGameContext } from "@/context/GameContext";
import { useEffect, useState } from "react";

export const usePieceState = (
  team: string,
  currentWellId: string | undefined,
  id: string
) => {
  const { layout, logic } = useGameContext();
  const [onBoard, setOnBoard] = useState(false);
  const [myTurn, setMyTurn] = useState(false);

  useEffect(() => {
    setMyTurn(team === logic.currentTeam);
  }, [logic.turnCount]);

  // sync well location when piece mounts
  useEffect(() => {
    if (currentWellId) {
      layout.setWellPieceLocations((prev) => ({
        ...prev,
        [currentWellId]: id,
      }));
    }
  }, []);

  return { onBoard, setOnBoard, myTurn };
};
