import Board from "@/components/Board";
import Glass from "@/components/Glass";
import HamburgerMenu from "@/components/HamburgerMenu";
import LoadingScreen from "@/components/LoadingScreen";
import Piece from "@/components/Piece";
import SlotRim from "@/components/SlotRim";
import TeamWellGrid from "@/components/TeamWellGrid";
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
import { useSharedValue, withTiming } from "react-native-reanimated";

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
      console.log("Shake for reset");
    },
  });
  const piecesToRender = React.useMemo(
    () => (layout.layoutReady ? Object.entries(pieces) : []),
    [layout.layoutReady, pieces]
  );

  const [loadTimer, setLoadTimer] = useState(true);
  const loadAnimationLoops = 0;

  useEffect(() => {
    setTimeout(() => setLoadTimer(false), 5000 * loadAnimationLoops);
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
  /* const menuStyle = useAnimatedStyle(() => ({ opacity: menuOpacity.value })); */

  return (
    <View
      className="flex-1 flex-col items-center justify-center"
      style={{
        backgroundColor: settings.theme?.colorTheme?.FELT_TOP || "#065f46",
      }}
    >
      {/* WinModal wired via game flow slice if needed */}
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
        piecesToRender.map(([id, p]) => (
          <Piece key={id} id={id} team={p.team} />
        ))}

      <LoadingScreen visible={!layout.layoutReady || loadTimer} />

      {/* Tutorial overlay and modal render above gameplay UI */}
      {/* {layout.layoutReady && !loadTimer && <TutorialMount />} */}
      {/*
      {layout.layoutReady && !loadTimer && (
        <Animated.View
          style={menuStyle}
          pointerEvents={!settings.tutorialEnabled ? "auto" : "none"}
          className="absolute bottom-6 right-6"
        >
          <HamburgerMenu onPress={() => router.replace("/")} />
        </Animated.View>
      )} */}
      <HamburgerMenu onPress={() => router.replace("/")} />
    </View>
  );
};

export default GamePlay;

// Separate child to safely use hooks conditionally above the rest of the UI
/* const TutorialMount = () => {
  const tutorial = useTutorial();
  return (
    <>
      {tutorial.overlay}
      {tutorial.modal}
    </>
  );
};
 */
