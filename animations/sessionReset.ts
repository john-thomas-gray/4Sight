import { Team, type GameState } from "@/engine";
import type { LayoutContextType } from "@/context/LayoutContext";
import type { ThemeType } from "@/types/themes/theme";
import { Easing, withSequence, withTiming } from "react-native-reanimated";
import { RESET_WINNER_ENERGY_SUCK_MS, type PieceAnimation, RESET_TO_WELL_BEAT_MS, RESET_TO_WELL_LOWER_MS, RESET_TO_WELL_RISE_DY, RESET_TO_WELL_RISE_MS, RESET_TO_WELL_ZIP_MS } from "@/types/animation";
export function animateSessionReset(gameState: GameState, layout: LayoutContextType, theme: ThemeType, pieceAnims: Record<string, PieceAnimation>, initialWellMap: Record<string, string>) {
  const pieceToWellId = Object.fromEntries(Object.entries(initialWellMap).map(([well, id]) => [id, well]));
  const boardPieceIds = Object.values(gameState.board);
  for (const pieceId of boardPieceIds) {
    const targetWellId = pieceToWellId[pieceId];
    const piece = gameState.pieces[pieceId];
    const targetWellLayout = piece && targetWellId ? layout.wells[piece.team]?.[targetWellId] : null;
    const anim = pieceAnims[pieceId];
    if (!anim || !targetWellLayout) continue;
    const teamDefaultColor = piece.team === Team.One ? theme.colorTheme.TEAM_ONE_COLOR : theme.colorTheme.TEAM_TWO_COLOR;
    const targetX = targetWellLayout.pageX + targetWellLayout.width / 2 - 16;
    const targetY = targetWellLayout.pageY + targetWellLayout.height / 2 - 16;
    const startX = anim.translateX.value;
    const startY = anim.translateY.value;
    const riseY = startY - RESET_TO_WELL_RISE_DY;
    const zipEase = Easing.inOut(Easing.cubic);
    anim.scaleX.value = 1.5;
    anim.scaleY.value = 1.5;
    anim.zIndex.value = 5000;
    anim.color.value = teamDefaultColor;
    anim.winnerGlow.value = withSequence(withTiming(-1, {
      duration: RESET_WINNER_ENERGY_SUCK_MS,
      easing: Easing.inOut(Easing.quad)
    }), withTiming(0, {
      duration: 90,
      easing: Easing.out(Easing.quad)
    }));
    anim.winnerEnergy.value = withSequence(withTiming(anim.winnerEnergy.value + 0.45, {
      duration: RESET_WINNER_ENERGY_SUCK_MS,
      easing: Easing.inOut(Easing.cubic)
    }), withTiming(0, { duration: 1 }));
    anim.translateX.value = withSequence(withTiming(startX, {
      duration: RESET_TO_WELL_RISE_MS
    }), withTiming(startX, {
      duration: RESET_TO_WELL_BEAT_MS
    }), withTiming(targetX, {
      duration: RESET_TO_WELL_ZIP_MS,
      easing: zipEase
    }), withTiming(targetX, {
      duration: RESET_TO_WELL_BEAT_MS
    }), withTiming(targetX, {
      duration: RESET_TO_WELL_LOWER_MS
    }));
    anim.translateY.value = withSequence(withTiming(riseY, {
      duration: RESET_TO_WELL_RISE_MS,
      easing: Easing.out(Easing.cubic)
    }), withTiming(riseY, {
      duration: RESET_TO_WELL_BEAT_MS
    }), withTiming(targetY, {
      duration: RESET_TO_WELL_ZIP_MS,
      easing: zipEase
    }), withTiming(targetY, {
      duration: RESET_TO_WELL_BEAT_MS
    }), withTiming(targetY, {
      duration: RESET_TO_WELL_LOWER_MS,
      easing: Easing.out(Easing.quad)
    }, finished => {
      if (!finished) return;
      anim.scaleX.value = 1.1;
      anim.scaleY.value = 1.1;
      anim.zIndex.value = 500;
    }));
    anim.scaleX.value = withSequence(withTiming(1.5, {
      duration: RESET_TO_WELL_RISE_MS
    }), withTiming(1.5, {
      duration: RESET_TO_WELL_BEAT_MS
    }), withTiming(1.5, {
      duration: RESET_TO_WELL_ZIP_MS
    }), withTiming(1.5, {
      duration: RESET_TO_WELL_BEAT_MS
    }), withTiming(1.1, {
      duration: RESET_TO_WELL_LOWER_MS
    }));
    anim.scaleY.value = withSequence(withTiming(1.5, {
      duration: RESET_TO_WELL_RISE_MS
    }), withTiming(1.5, {
      duration: RESET_TO_WELL_BEAT_MS
    }), withTiming(1.5, {
      duration: RESET_TO_WELL_ZIP_MS
    }), withTiming(1.5, {
      duration: RESET_TO_WELL_BEAT_MS
    }), withTiming(1.1, {
      duration: RESET_TO_WELL_LOWER_MS
    }));
  }
}
