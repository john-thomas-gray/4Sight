import Board from "@/components/Board";
import LoadingScreen from "@/components/LoadingScreen";
import Piece from "@/components/Piece";
import TeamWellGrid from "@/components/TeamWellGrid";
import { useGameContext } from "@/context/GameContext";
import { Team } from "@/types/board";
import React from "react";
import { View } from "react-native";

const GamePlay = () => {
  const { layout, logic, settings } = useGameContext();

  return (
    <View
      className="flex-1 flex-row items-center justify-center mt-90"
      style={{ backgroundColor: settings.colorTheme.FELT_TOP }}
    >
      <View className="flex-row justify-between">
        <TeamWellGrid team={Team.TeamOne} />
        <Board className="mx-10" />
        <TeamWellGrid team={Team.TeamTwo} />
      </View>

      {layout.layoutReady &&
        Object.entries(logic.pieces).map(([id, p]) => (
          <Piece key={id} id={id} team={p.team} state={p.state} />
        ))}

      {!layout.layoutReady && <LoadingScreen />}
    </View>
  );
};

export default GamePlay;
