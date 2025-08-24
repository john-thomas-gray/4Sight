import backArrow from "../assets/images/backArrow.png";
import cornerArrowNW from "../assets/images/corner-arrow-NW.png";
import cornerArrowSE from "../assets/images/corner-arrow-SE.png";
import cornerArrowSW from "../assets/images/corner-arrow-SW.png";
import cornerArrowNE from "../assets/images/cornerArrowNE.png";
import slotArrowEastBlack from "../assets/images/slot-arrow-east-two.png";
import slotArrowEastWhite from "../assets/images/slot-arrow-east.png";
import slotArrowNorthBlack from "../assets/images/slot-arrow-north-two.png";
import slotArrowNorthWhite from "../assets/images/slot-arrow-north.png";
import slotArrowSouthBlack from "../assets/images/slot-arrow-south-two.png";
import slotArrowSouthWhite from "../assets/images/slot-arrow-south.png";
import slotArrowWestBlack from "../assets/images/slot-arrow-west-two.png";
import slotArrowWestWhite from "../assets/images/slot-arrow-west.png";
import { TEAM_ONE_COLOR, TEAM_TWO_COLOR } from "./gameElements";

export const icons = {
  corner: {
    NE: cornerArrowNE,
    NW: cornerArrowNW,
    SE: cornerArrowSE,
    SW: cornerArrowSW,
  },
  slot: {
    E: {
      [TEAM_TWO_COLOR]: slotArrowEastBlack,
      [TEAM_ONE_COLOR]: slotArrowEastWhite,
    },
    N: {
      [TEAM_TWO_COLOR]: slotArrowNorthBlack,
      [TEAM_ONE_COLOR]: slotArrowNorthWhite,
    },
    S: {
      [TEAM_TWO_COLOR]: slotArrowSouthBlack,
      [TEAM_ONE_COLOR]: slotArrowSouthWhite,
    },
    W: {
      [TEAM_TWO_COLOR]: slotArrowWestBlack,
      [TEAM_ONE_COLOR]: slotArrowWestWhite,
    },
  },
};

export const images = {
  backArrow: backArrow,
};
