import { SLOT_TO_SPACE } from "@/constants/animations";
import { EarlyEnableTimeoutProps } from "@/types/utils";

const earlyEnableTimeout = ({
  moveType,
  setEarlyPieceEnable,
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

  firstTimeoutId = setTimeout(() => {
    setEarlyPieceEnable(true);
    if (firstTimeoutId !== null) {
      clearTimeout(firstTimeoutId);
      firstTimeoutId = null;
    }
    console.log("early enable timeout first timeout");
    secondTimeoutId = setTimeout(() => {
      setEarlyPieceEnable(false);
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
