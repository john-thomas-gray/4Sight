import { loadAppState, PersistedAppState } from "@/utils/useAsyncStorage";
import React from "react";

type UseHasSavedGameProps = {
  setHasSavedGame: React.Dispatch<React.SetStateAction<boolean>>;
};

const hasBoardState = (saved?: PersistedAppState) => {
  if (!saved) return false;
  const { boardPieceLocations } = saved;
  return Boolean(
    boardPieceLocations && Object.keys(boardPieceLocations).length > 0
  );
};

export const useHasSavedGame = ({ setHasSavedGame }: UseHasSavedGameProps) => {
  const computeHasSavedGame = React.useCallback(hasBoardState, []);

  const refreshHasSavedGame = React.useCallback(async () => {
    const saved = await loadAppState();
    setHasSavedGame(computeHasSavedGame(saved));
  }, [computeHasSavedGame, setHasSavedGame]);

  React.useEffect(() => {
    let active = true;

    (async () => {
      const saved = await loadAppState();
      if (!active) return;
      setHasSavedGame(computeHasSavedGame(saved));
    })();

    return () => {
      active = false;
    };
  }, [computeHasSavedGame, setHasSavedGame]);

  return { refreshHasSavedGame };
};
