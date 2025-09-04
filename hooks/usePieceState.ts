import { useMegaContext } from "@/context/MegaContext";
import { useEffect, useState } from "react";

export const usePieceState = (
  team: string,
  currentWellId: string | undefined,
  id: string
) => {
  const { layout, logic } = useMegaContext();
  const [onBoard, setOnBoard] = useState(false);
  const [myTurn, setMyTurn] = useState(false);

  useEffect(() => {
    // Commented part doesn't work
    // if (logic.gameState === GameState.Finished) return;
    setMyTurn(team === logic.currentTeam);
  }, [logic.turnCount]);

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
