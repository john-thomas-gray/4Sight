import Board from "@/components/Board";
import Glass from "@/components/Glass";
import HamburgerMenu from "@/components/HamburgerMenu";
import LoadingScreen from "@/components/LoadingScreen";
import Piece from "@/components/Piece";
import SlotRim from "@/components/SlotRim";
import TeamWellGrid from "@/components/TeamWellGrid";
import { TutorialMount } from "@/components/TutorialMount";
import { useGameContext } from "@/context/GameContext";
import {
  useLogicBoardState,
  useLogicGameFlow,
  useLogicUI,
} from "@/context/LogicContext";

import { useShake as useShakeHook } from "@/hooks/useShake";
import { Team } from "@/types/board";
import { GameState } from "@/types/logic";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const GamePlay = () => {
  const { layout, settings } = useGameContext();
  const gameFlow = useLogicGameFlow();
  const { gameState, resetGame } = gameFlow;
  const boardState = useLogicBoardState();
  const { pieces } = boardState;
  const ui = useLogicUI();
  const { setIsGlobalLoading } = ui;
  const router = useRouter();
  useShakeHook({
    enabled:
      gameState === GameState.Finished || gameState === GameState.Playing,
    onShake: () => {
      resetGame();
    },
  });
  const [piecesReady, setPiecesReady] = useState(false);

  React.useEffect(() => {
    if (layout.layoutReady && Object.keys(pieces).length > 0) {
      setPiecesReady(true);
    } else if (!layout.layoutReady || Object.keys(pieces).length === 0) {
      setPiecesReady(false);
    }
  }, [layout.layoutReady, pieces]);

  const piecesToRender = React.useMemo(() => Object.entries(pieces), [pieces]);

  const [loadTimer, setLoadTimer] = useState(true);
  const loadAnimationLoops = 0;

  useEffect(() => {
    const timeoutId = setTimeout(
      () => setLoadTimer(false),
      5000 * loadAnimationLoops
    );
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (layout.layoutReady && !loadTimer) {
      setIsGlobalLoading(false);
    }
  }, [layout.layoutReady, loadTimer, setIsGlobalLoading]);

  const menuOpacity = useSharedValue(0);
  useEffect(() => {
    const target = !settings.tutorialEnabled ? 1 : 0;
    menuOpacity.value = withTiming(target, { duration: 400 });
  }, [settings.tutorialEnabled, menuOpacity]);
  const menuStyle = useAnimatedStyle(() => ({ opacity: menuOpacity.value }));

  return (
    <View
      className="flex-1 flex-col items-center justify-center"
      style={{
        backgroundColor: settings.theme?.colorTheme?.FELT_TOP || "#065f46",
      }}
    >
      <View className="flex-col items-center justify-center">
        <TeamWellGrid team={Team.TeamTwo} />
        <Board className="mt-7 mb-7" />
        <TeamWellGrid team={Team.TeamOne} />
      </View>

      {layout.layoutReady && <Glass />}

      {layout.layoutReady &&
        Object.keys(layout.slots).map((slotId) => (
          <SlotRim key={`slotrim-${slotId}`} id={slotId} />
        ))}

      {layout.layoutReady &&
        piecesReady &&
        piecesToRender.map(([id, p]) => (
          <Piece key={id} id={id} team={p.team} />
        ))}

      <LoadingScreen visible={!layout.layoutReady || loadTimer} />

      {layout.layoutReady && !loadTimer && <TutorialMount />}

      {layout.layoutReady && !loadTimer && (
        <Animated.View
          style={menuStyle}
          pointerEvents={!settings.tutorialEnabled ? "auto" : "none"}
          className="absolute bottom-6 right-6"
        >
          <HamburgerMenu onPress={() => router.replace("/")} />
        </Animated.View>
      )}
    </View>
  );
};

export default GamePlay;
