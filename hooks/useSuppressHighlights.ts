import { GameState } from "@/types/logic";
import { useEffect } from "react";
import {
  Easing,
  SharedValue,
  cancelAnimation,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type UseSuppressHighlightsParams = {
  highlightPulse: SharedValue<number>;
  isPreviewingGravity: boolean;
  gravityAnimating: boolean;
  gameState: GameState;
  nextTurnWins?: Record<string, boolean>;
};

export const useSuppressHighlights = ({
  highlightPulse,
  isPreviewingGravity,
  gravityAnimating,
  gameState,
  nextTurnWins = {},
}: UseSuppressHighlightsParams) => {
  useEffect(() => {
    cancelAnimation(highlightPulse);
    const noHighlights = Object.keys(nextTurnWins || {}).length === 0;
    const notPlaying = gameState !== GameState.Playing;

    if (isPreviewingGravity || gravityAnimating || notPlaying || noHighlights) {
      highlightPulse.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      });
    } else {
      highlightPulse.value = 0;
      highlightPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
    }

    return () => {
      cancelAnimation(highlightPulse);
    };
  }, [
    highlightPulse,
    isPreviewingGravity,
    gravityAnimating,
    gameState,
    nextTurnWins,
  ]);
};
