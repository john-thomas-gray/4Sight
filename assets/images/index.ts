import { Team } from "@/types/board";
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
      [Team.TeamOne]: slotArrowClear,
      [Team.TeamTwo]: slotArrowClear,
    },
    N: {
      [Team.TeamTwo]: slotArrowClear,
      [Team.TeamOne]: slotArrowClear,
    },
    S: {
      [Team.TeamTwo]: slotArrowClear,
      [Team.TeamOne]: slotArrowClear,
    },
    W: {
      [Team.TeamTwo]: slotArrowClear,
      [Team.TeamOne]: slotArrowClear,
    },
    C: {
      [Team.TeamTwo]: slotArrowClear,
      [Team.TeamOne]: slotArrowClear,
    },
  },
};

export const images = {
  backArrow: backArrow,
};
