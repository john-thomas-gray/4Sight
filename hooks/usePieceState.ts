import { useGameContext } from "@/context/GameContext";
import { useEffect, useState } from "react";

export const usePieceState = (team: string, id: string) => {
  const { layout, logic } = useGameContext();
  const [onBoard, setOnBoard] = useState(false);
  const [myTurn, setMyTurn] = useState(false);

  useEffect(() => {
    // Commented part doesn't work
    // if (logic.gameState === GameState.Finished) return;
    setMyTurn(team === logic.currentTeam);
  }, [logic.turnCount]);

  return { onBoard, setOnBoard, myTurn };
};
