import Board from "@/components/Board";
import HamburgerMenu from "@/components/HamburgerMenu";
import LoadingScreen from "@/components/LoadingScreen";
import Piece from "@/components/Piece";
import TeamWellGrid from "@/components/TeamWellGrid";
import WinModal from "@/components/WinModal";
import { useGameContext } from "@/context/GameContext";
import { useShake } from "@/hooks/useShake";
import { Team } from "@/types/board";
import { GameState } from "@/types/logic";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";

const GamePlay = () => {
  const { layout, logic, settings } = useGameContext();
  const router = useRouter();
  useShake({
    enabled: logic.gameState === GameState.Playing,
    // onShake: forfeit,
    onShake: () => logic.resetGame(logic.playersTurn, true),
  });
  useShake({
    enabled: logic.gameState === GameState.PostGame,
    onShake: () => logic.resetGame(logic.playersTurn, false),
  });
  const piecesToRender = React.useMemo(
    () => (layout.layoutReady ? Object.entries(logic.pieces) : []),
    [layout.layoutReady, logic.pieces]
  );

  const [loadTimer, setLoadTimer] = useState(true);
  const loadAnimationLoops = 2;

  useEffect(() => {
    setTimeout(() => setLoadTimer(false), 5000 * loadAnimationLoops);
  }, []);

  return (
    <View
      className="flex-1 flex-col items-center justify-center"
      style={{
        backgroundColor: settings.theme?.colorTheme?.FELT_TOP || "#065f46",
      }}
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

      <LoadingScreen visible={!layout.layoutReady || loadTimer} />

      {layout.layoutReady && !loadTimer && (
        <HamburgerMenu
          onPress={() => router.replace("/")}
          className="absolute bottom-6 right-6"
        />
      )}
    </View>
  );
};

export default GamePlay;
