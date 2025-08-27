import { Winner } from "@/types/logic";
import backArrow from "./backArrow.png";
import cornerArrowNW from "./corner-arrow-NW.png";
import cornerArrowSE from "./corner-arrow-SE.png";
import cornerArrowSW from "./corner-arrow-SW.png";
import cornerArrowNE from "./cornerArrowNE.png";
import slotArrowClear from "./slot-arrow-clear.png";

export const cellImages = {
  corner: {
    NE: cornerArrowNE,
    NW: cornerArrowNW,
    SE: cornerArrowSE,
    SW: cornerArrowSW,
  },
  slot: {
    E: {
      [Winner.TeamOne]: slotArrowClear,
      [Winner.TeamTwo]: slotArrowClear,
    },
    N: {
      [Winner.TeamTwo]: slotArrowClear,
      [Winner.TeamOne]: slotArrowClear,
    },
    S: {
      [Winner.TeamTwo]: slotArrowClear,
      [Winner.TeamOne]: slotArrowClear,
    },
    W: {
      [Winner.TeamTwo]: slotArrowClear,
      [Winner.TeamOne]: slotArrowClear,
    },
    C: {
      [Winner.TeamTwo]: slotArrowClear,
      [Winner.TeamOne]: slotArrowClear,
    },
  },
};

export const images = {
  backArrow: backArrow,
};
