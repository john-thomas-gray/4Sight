import Board from "@/components/Board";
import LoadingScreen from "@/components/LoadingScreen";
import Piece from "@/components/Piece";
import TeamWellGrid from "@/components/TeamWellGrid";
import WinModal from "@/components/WinModal";
import { useGameContext } from "@/context/GameContext";
import { useShake } from "@/hooks/useShake";
import { Team } from "@/types/board";
import { GameState } from "@/types/logic";
import React from "react";
import { View } from "react-native";

const GamePlay = () => {
  const { layout, logic, settings } = useGameContext();
  const forfeit = React.useCallback(() => {
    const winningTeam =
      logic.currentTeam === Team.TeamOne ? Team.TeamTwo : Team.TeamOne;
    logic.setWinner(winningTeam);
    logic.setGameState(GameState.Finished);
  }, [logic]);
  useShake({
    enabled: logic.gameState === GameState.Playing,
    onShake: forfeit,
  });
  useShake({
    enabled: logic.gameState === GameState.PostGame,
    onShake: () => logic.resetGame(logic.playersTurn, false),
  });
  const piecesToRender = React.useMemo(
    () => (layout.layoutReady ? Object.entries(logic.pieces) : []),
    [layout.layoutReady, logic.pieces]
  );

  return (
    <View
      className="flex-1 flex-col items-center justify-center"
      style={{ backgroundColor: settings.colorTheme.FELT_TOP }}
    >
      <WinModal
        visible={logic.gameState === GameState.Finished}
        winner={logic.winner}
      />
      <View className="flex-col items-center justify-center">
        <TeamWellGrid team={Team.TeamTwo} />
        <Board className="mt-7 mb-7" />
        <TeamWellGrid team={Team.TeamOne} />
      </View>

      {layout.layoutReady &&
        piecesToRender.map(([id, p]) => (
          <Piece key={id} id={id} team={p.team} />
        ))}

      {/* {!layout.layoutReady &&  */}
      <LoadingScreen />
      {/* // } */}
    </View>
  );
};

export default GamePlay;
