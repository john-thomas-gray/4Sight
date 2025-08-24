import { MASTER } from "../../constants/colorThemes";
import backArrow from "./backArrow.png";
import cornerArrowNW from "./corner-arrow-NW.png";
import cornerArrowSE from "./corner-arrow-SE.png";
import cornerArrowSW from "./corner-arrow-SW.png";
import cornerArrowNE from "./cornerArrowNE.png";
import slotArrowClear from "./slot-arrow-clear.png";
import slotArrowEastBlack from "./slot-arrow-east-two.png";
import slotArrowEastWhite from "./slot-arrow-east.png";
import slotArrowNorthBlack from "./slot-arrow-north-two.png";
import slotArrowNorthWhite from "./slot-arrow-north.png";
import slotArrowSouthBlack from "./slot-arrow-south-two.png";
import slotArrowSouthWhite from "./slot-arrow-south.png";
import slotArrowWestBlack from "./slot-arrow-west-two.png";
import slotArrowWestWhite from "./slot-arrow-west.png";

export const cellImages = {
  corner: {
    NE: cornerArrowNE,
    NW: cornerArrowNW,
    SE: cornerArrowSE,
    SW: cornerArrowSW,
  },
  slot: {
    E: {
      [MASTER.TEAM_TWO_COLOR]: slotArrowEastBlack,
      [MASTER.TEAM_ONE_COLOR]: slotArrowEastWhite,
    },
    N: {
      [MASTER.TEAM_TWO_COLOR]: slotArrowNorthBlack,
      [MASTER.TEAM_ONE_COLOR]: slotArrowNorthWhite,
    },
    S: {
      [MASTER.TEAM_TWO_COLOR]: slotArrowSouthBlack,
      [MASTER.TEAM_ONE_COLOR]: slotArrowSouthWhite,
    },
    W: {
      [MASTER.TEAM_TWO_COLOR]: slotArrowWestBlack,
      [MASTER.TEAM_ONE_COLOR]: slotArrowWestWhite,
    },
    C: {
      [MASTER.TEAM_TWO_COLOR]: slotArrowClear,
      [MASTER.TEAM_ONE_COLOR]: slotArrowClear,
    },
  },
};

export const images = {
  backArrow: backArrow,
};
