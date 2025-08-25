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
      ["teamOne"]: slotArrowClear,
      ["teamTwo"]: slotArrowClear,
    },
    N: {
      ["teamTwo"]: slotArrowClear,
      ["teamOne"]: slotArrowClear,
    },
    S: {
      ["teamTwo"]: slotArrowClear,
      ["teamOne"]: slotArrowClear,
    },
    W: {
      ["teamTwo"]: slotArrowClear,
      ["teamOne"]: slotArrowClear,
    },
    C: {
      ["teamTwo"]: slotArrowClear,
      ["teamOne"]: slotArrowClear,
    },
  },
};

export const images = {
  backArrow: backArrow,
};
