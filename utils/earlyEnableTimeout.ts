import { SLOT_TO_SPACE } from "@/constants/animations";
import { GameMode, Turn } from "@/types/logic";
import { EarlyEnableTimeoutProps } from "@/types/utils";

const earlyEnableTimeout = ({
  moveType,
  gameMode,
  playersTurn,
  setTurnEnabledEarly,
}: EarlyEnableTimeoutProps) => {
  const timeout =
    moveType === "slot"
      ? SLOT_TO_SPACE
      : moveType === "space"
      ? SLOT_TO_SPACE
      : moveType === "gravity"
      ? SLOT_TO_SPACE
      : SLOT_TO_SPACE;
  let firstTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let secondTimeoutId: ReturnType<typeof setTimeout> | null = null;
  console.log("playersTurn", playersTurn);
  firstTimeoutId = setTimeout(() => {
    if (gameMode === GameMode.TwoPlayer) {
      const oppositeTurn =
        playersTurn === Turn.One || playersTurn === Turn.Three
          ? Turn.Two
          : playersTurn === Turn.Two || playersTurn === Turn.Four
          ? Turn.One
          : undefined;
      console.log("oppositeTurn", oppositeTurn);
      setTurnEnabledEarly(oppositeTurn);
    } else {
      // Future: define behavior for four-player if needed
      setTurnEnabledEarly(undefined);
    }
    if (firstTimeoutId !== null) {
      clearTimeout(firstTimeoutId);
      firstTimeoutId = null;
    }
    console.log("early enable timeout first timeout");
    secondTimeoutId = setTimeout(() => {
      setTurnEnabledEarly(undefined);
      if (secondTimeoutId !== null) {
        clearTimeout(secondTimeoutId);
        secondTimeoutId = null;
      }
      console.log("early enable timeout second timeout");
    }, 5000);
  }, timeout);

  return () => {
    if (firstTimeoutId !== null) {
      clearTimeout(firstTimeoutId);
      firstTimeoutId = null;
    }
    if (secondTimeoutId !== null) {
      clearTimeout(secondTimeoutId);
      secondTimeoutId = null;
    }
  };
};

export default earlyEnableTimeout;
