import Board from "@/components/Board";
import Glass from "@/components/Glass";
import HamburgerMenu from "@/components/HamburgerMenu";
import LoadingScreen from "@/components/LoadingScreen";
import Piece from "@/components/Piece";
import SlotRim from "@/components/SlotRim";
import TeamWellGrid from "@/components/TeamWellGrid";
import { useGameContext } from "@/context/GameContext";
import { useShake } from "@/hooks/useShake";
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
import useTutorial from "../hooks/useTutorial";

const GamePlay = () => {
  const { layout, logic, settings } = useGameContext();
  const router = useRouter();
  useShake({
    enabled:
      logic.gameState === GameState.PostGame ||
      logic.gameState === GameState.Finished ||
      logic.gameState === GameState.Playing,
    onShake: () => {
      logic.resetGame(logic.playersTurn, false);
    },
  });
  const piecesToRender = React.useMemo(
    () => (layout.layoutReady ? Object.entries(logic.pieces) : []),
    [layout.layoutReady, logic.pieces]
  );

  const [loadTimer, setLoadTimer] = useState(true);
  const loadAnimationLoops = 1.5;

  useEffect(() => {
    setTimeout(() => setLoadTimer(false), 5000 * loadAnimationLoops);
  }, []);

  // Hide global loading once gameplay layout is ready and local timer finished
  useEffect(() => {
    if (layout.layoutReady && !loadTimer) {
      logic.setIsGlobalLoading(false);
    }
  }, [layout.layoutReady, loadTimer, logic]);

  // Fade-in for the menu when tutorial ends
  const menuOpacity = useSharedValue(0);
  useEffect(() => {
    const target = !settings.tutorialEnabled ? 1 : 0;
    menuOpacity.value = withTiming(target, { duration: 400 });
  }, [settings.tutorialEnabled]);
  const menuStyle = useAnimatedStyle(() => ({ opacity: menuOpacity.value }));

  return (
    <View
      className="flex-1 flex-col items-center justify-center"
      style={{
        backgroundColor: settings.theme?.colorTheme?.FELT_TOP || "#065f46",
      }}
    >
      {/* <WinModal
        visible={logic.gameState === GameState.Finished}
        winner={logic.winner}
      /> */}
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

// Separate child to safely use hooks conditionally above the rest of the UI
const TutorialMount = () => {
  const tutorial = useTutorial();
  return (
    <>
      {tutorial.overlay}
      {tutorial.modal}
    </>
  );
};
