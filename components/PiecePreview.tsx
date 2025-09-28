import { GameElements } from "@/constants";
import { useGameContext } from "@/context/GameContext";
import { Team } from "@/types/board";
import React from "react";
import { ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

type PiecePreviewProps = {
  spaceId: string;
  team: Team;
  offsetX?: number;
  offsetY?: number;
};

const PiecePreview = ({
  spaceId,
  team,
  offsetX = 0,
  offsetY = 0,
}: PiecePreviewProps) => {
  const { layout, settings } = useGameContext();
  const space = layout.spaces[spaceId];
  if (!space) return null;

  const style: ViewStyle = {
    height: GameElements.PIECE_SIZE,
    width: GameElements.PIECE_SIZE,
    borderRadius: GameElements.PIECE_RADIUS,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    zIndex: 2000,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: space.pageY - offsetY + space.height / 2 - GameElements.PIECE_RADIUS,
    left: space.pageX - offsetX + space.width / 2 - GameElements.PIECE_RADIUS,
    backgroundColor:
      team === Team.TeamOne
        ? settings.theme?.colorTheme?.TEAM_ONE_COLOR || "#ffffff"
        : settings.theme?.colorTheme?.TEAM_TWO_COLOR || "#000000",
    opacity: 0.5,
  };

  return <Animated.View style={style} />;
};

export default PiecePreview;
