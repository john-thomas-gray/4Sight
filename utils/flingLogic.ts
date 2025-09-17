import { Direction } from "@/types/board";
import { RefObject } from "react";
import { scheduleOnRN } from "react-native-worklets";

type Axis = "x" | "y";
type Dir = "horizontal" | "vertical";

type CreateHandleFlingParams = {
  lastFlingDirection: RefObject<null | Dir>;
  lastFlingAxis: RefObject<null | Axis>;
  lastFlingSign: RefObject<null | number>;
  flingCount: RefObject<number>;
  lastFlingTime: RefObject<number>;
  pullActionDelay: number;
  executePull: (direction: Direction) => void;
};

export function createHandleFling({
  lastFlingDirection,
  lastFlingAxis,
  lastFlingSign,
  flingCount,
  lastFlingTime,
  pullActionDelay,
  executePull,
}: CreateHandleFlingParams) {
  let timeoutId: number | null = null;

  const resetFling = () => {
    lastFlingDirection.current = null;
    lastFlingAxis.current = null;
    lastFlingSign.current = null;
    flingCount.current = 0;
    lastFlingTime.current = 0;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return (direction: Direction) => {
    let axis: Axis;
    let sign: number;
    let dir: Dir;
    if (direction === Direction.Left || direction === Direction.Right) {
      axis = "x";
      dir = "horizontal";
      sign = direction === Direction.Left ? -1 : 1;
    } else {
      axis = "y";
      dir = "vertical";
      sign = direction === Direction.Up ? -1 : 1;
    }

    const now = Date.now();

    if (flingCount.current === 0) {
      lastFlingAxis.current = axis;
      lastFlingSign.current = sign;
      lastFlingDirection.current = dir;
      flingCount.current = 1;
    } else {
      if (
        now - lastFlingTime.current <= pullActionDelay &&
        lastFlingAxis.current === axis &&
        lastFlingSign.current === -sign &&
        lastFlingDirection.current === dir
      ) {
        flingCount.current += 1;
        lastFlingSign.current = sign;
      } else {
        lastFlingAxis.current = axis;
        lastFlingSign.current = sign;
        lastFlingDirection.current = dir;
        flingCount.current = 1;
        lastFlingTime.current = now;

        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (flingCount.current === 1) {
            scheduleOnRN(executePull, direction);
            flingCount.current = 0;
          }
        }, pullActionDelay);
        return;
      }
      if (flingCount.current === 3) {
        console.log("Forfeit");
        resetFling();
      }
    }

    lastFlingTime.current = now;

    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (flingCount.current === 1) {
        scheduleOnRN(executePull, direction);
        flingCount.current = 0;
      }
    }, pullActionDelay);
  };
}
