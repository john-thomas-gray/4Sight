import { GameElements } from "@/constants";
import { PieceStatus, useGameSessionSelector } from "@/context/GameSessionContext";
import React, { memo, useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  RadialGradient,
  Stop,
} from "react-native-svg";

interface GlowProps {
  pieceId: string;
}

const TAU = Math.PI * 2;
const AURA_SIZE = GameElements.PIECE_SIZE * 2.85;
const AURA_OFFSET = -(AURA_SIZE - GameElements.PIECE_SIZE) / 2;
const CORE_SIZE = GameElements.PIECE_SIZE * 1.26;
const CORE_OFFSET = -(CORE_SIZE - GameElements.PIECE_SIZE) / 2;

function glowLevel(value: number, isWinner: boolean): number {
  "worklet";

  if (!isWinner) return 0;
  return Math.max(0, Math.min(1.18, value));
}

function suctionLevel(value: number, isWinner: boolean): number {
  "worklet";

  if (!isWinner) return 0;
  return Math.max(0, Math.min(1, -value));
}

const Glow: React.FC<GlowProps> = ({ pieceId }) => {
  const { animate, pieceStatus } = useGameSessionSelector((session) => ({
    animate: session.pieceAnims[pieceId],
    pieceStatus: session.pieceStatusMap[pieceId],
  }));
  const fallbackGlow = useSharedValue(0);
  const fallbackEnergy = useSharedValue(0);
  const winnerGlow = animate?.winnerGlow ?? fallbackGlow;
  const winnerEnergy = animate?.winnerEnergy ?? fallbackEnergy;
  const isWinner = pieceStatus === PieceStatus.winner;

  const gradientId = useMemo(() => `winner-energy-${pieceId}`, [pieceId]);
  const rimGradientId = useMemo(() => `winner-rim-${pieceId}`, [pieceId]);

  const auraStyle = useAnimatedStyle(() => {
    const glow = glowLevel(winnerGlow.value, isWinner);
    const suction = suctionLevel(winnerGlow.value, isWinner);
    const visible = Math.min(1, glow);
    const phase = winnerEnergy.value;
    const breath = Math.sin(phase * TAU);
    const shimmer = Math.sin((phase * 3.2 + 0.18) * TAU);
    const suctionScale = 0.86 - suction * 0.68;

    return {
      opacity:
        visible * (0.62 + Math.max(0, shimmer) * 0.22) +
        suction * 0.48,
      transform: [
        { rotate: `${breath * 3.5 + suction * 28}deg` },
        {
          scaleX:
            suction > 0
              ? suctionScale
              : 0.82 + glow * 0.24 + breath * 0.035,
        },
        {
          scaleY:
            suction > 0
              ? suctionScale * 0.86
              : 0.9 + glow * 0.16 - breath * 0.03,
        },
      ],
    };
  }, [isWinner, winnerEnergy, winnerGlow]);

  const rimStyle = useAnimatedStyle(() => {
    const glow = glowLevel(winnerGlow.value, isWinner);
    const suction = suctionLevel(winnerGlow.value, isWinner);
    const visible = Math.min(1, glow);
    const phase = winnerEnergy.value;
    const shimmer = Math.sin((phase * 2.4 + 0.44) * TAU);
    const suctionScale = 0.88 - suction * 0.62;

    return {
      opacity:
        visible * (0.38 + Math.max(0, shimmer) * 0.3) +
        suction * 0.72,
      transform: [
        { rotate: `${phase * 360 + suction * 115}deg` },
        {
          scaleX:
            suction > 0
              ? suctionScale
              : 0.9 + glow * 0.18 + shimmer * 0.04,
        },
        {
          scaleY:
            suction > 0
              ? suctionScale * 0.68
              : 0.72 + glow * 0.1 - shimmer * 0.025,
        },
      ],
    };
  }, [isWinner, winnerEnergy, winnerGlow]);

  const counterRimStyle = useAnimatedStyle(() => {
    const glow = glowLevel(winnerGlow.value, isWinner);
    const suction = suctionLevel(winnerGlow.value, isWinner);
    const visible = Math.min(1, glow);
    const phase = winnerEnergy.value;
    const ripple = Math.sin((phase * 2.1 + 0.7) * TAU);
    const suctionScale = 0.8 - suction * 0.55;

    return {
      opacity:
        visible * (0.28 + Math.max(0, ripple) * 0.22) +
        suction * 0.58,
      transform: [
        { rotate: `${-phase * 270 + 36 - suction * 100}deg` },
        {
          scaleX:
            suction > 0
              ? suctionScale * 0.72
              : 0.72 + glow * 0.12 - ripple * 0.035,
        },
        {
          scaleY:
            suction > 0
              ? suctionScale
              : 0.96 + glow * 0.18 + ripple * 0.03,
        },
      ],
    };
  }, [isWinner, winnerEnergy, winnerGlow]);

  const coreStyle = useAnimatedStyle(() => {
    const glow = glowLevel(winnerGlow.value, isWinner);
    const suction = suctionLevel(winnerGlow.value, isWinner);
    const visible = Math.min(1, glow);
    const phase = winnerEnergy.value;
    const pulse = Math.sin((phase * 3.8 + 0.25) * TAU);

    return {
      opacity:
        visible * (0.3 + Math.max(0, pulse) * 0.34) +
        suction * 0.86,
      transform: [
        { scaleX: 0.72 + glow * 0.18 + suction * 0.1 + pulse * 0.035 },
        { scaleY: 0.76 + glow * 0.2 + suction * 0.1 - pulse * 0.025 },
      ],
    };
  }, [isWinner, winnerEnergy, winnerGlow]);

  const sparkOneStyle = useAnimatedStyle(() => {
    const glow = glowLevel(winnerGlow.value, isWinner);
    const suction = suctionLevel(winnerGlow.value, isWinner);
    const visible = Math.min(1, glow);
    const phase = winnerEnergy.value;
    const spark = Math.max(0, Math.sin((phase * 2.6 + 0.06) * TAU));

    return {
      opacity: visible * spark * 0.9 + suction * 0.68,
      transform: [
        { rotate: `${-18 + phase * 34 - suction * 24}deg` },
        { translateX: 3 + spark * 3 - suction * 11 },
        { translateY: -2 - spark * 2 + suction * 6 },
        { scaleX: 0.75 + spark * 0.75 - suction * 0.32 },
      ],
    };
  }, [isWinner, winnerEnergy, winnerGlow]);

  const sparkTwoStyle = useAnimatedStyle(() => {
    const glow = glowLevel(winnerGlow.value, isWinner);
    const suction = suctionLevel(winnerGlow.value, isWinner);
    const visible = Math.min(1, glow);
    const phase = winnerEnergy.value;
    const spark = Math.max(0, Math.sin((phase * 2.2 + 0.62) * TAU));

    return {
      opacity: visible * spark * 0.72 + suction * 0.56,
      transform: [
        { rotate: `${156 - phase * 42 + suction * 26}deg` },
        { translateX: -2 - spark * 2 + suction * 10 },
        { translateY: 3 + spark - suction * 6 },
        { scaleX: 0.7 + spark * 0.55 - suction * 0.26 },
      ],
    };
  }, [isWinner, winnerEnergy, winnerGlow]);

  return (
    <Animated.View pointerEvents="none" style={styles.root}>
      <Animated.View style={[styles.auraLayer, auraStyle]}>
        <Svg height="100%" width="100%" viewBox="0 0 96 96">
          <Defs>
            <RadialGradient id={gradientId} cx="47%" cy="46%" r="55%">
              <Stop offset="0" stopColor="#fffdf0" stopOpacity="0.88" />
              <Stop offset="0.22" stopColor="#fff2a8" stopOpacity="0.56" />
              <Stop offset="0.5" stopColor="#f5b83d" stopOpacity="0.32" />
              <Stop offset="0.74" stopColor="#60f1ff" stopOpacity="0.12" />
              <Stop offset="1" stopColor="#ffd35a" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="48" cy="48" r="47" fill={`url(#${gradientId})`} />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.rimLayer, rimStyle]}>
        <Svg height="100%" width="100%" viewBox="0 0 96 96">
          <Defs>
            <RadialGradient id={rimGradientId} cx="50%" cy="50%" r="50%">
              <Stop offset="0.48" stopColor="#fff8c7" stopOpacity="0" />
              <Stop offset="0.72" stopColor="#fff8c7" stopOpacity="0.72" />
              <Stop offset="0.86" stopColor="#6cecff" stopOpacity="0.28" />
              <Stop offset="1" stopColor="#6cecff" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse
            cx="48"
            cy="48"
            rx="36"
            ry="23"
            fill="none"
            stroke={`url(#${rimGradientId})`}
            strokeWidth="5"
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.rimLayer, counterRimStyle]}>
        <Svg height="100%" width="100%" viewBox="0 0 96 96">
          <Ellipse
            cx="48"
            cy="48"
            rx="31"
            ry="18"
            fill="none"
            stroke="#fffdf0"
            strokeOpacity="0.7"
            strokeWidth="2.5"
          />
          <Ellipse
            cx="48"
            cy="48"
            rx="40"
            ry="26"
            fill="none"
            stroke="#63f0ff"
            strokeOpacity="0.22"
            strokeWidth="2"
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.core, coreStyle]} />
      <Animated.View style={[styles.spark, styles.sparkOne, sparkOneStyle]} />
      <Animated.View style={[styles.spark, styles.sparkTwo, sparkTwoStyle]} />
    </Animated.View>
  );
};

export default memo(Glow);

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    zIndex: 2,
  },
  auraLayer: {
    position: "absolute",
    left: AURA_OFFSET,
    top: AURA_OFFSET,
    width: AURA_SIZE,
    height: AURA_SIZE,
  },
  rimLayer: {
    position: "absolute",
    left: AURA_OFFSET,
    top: AURA_OFFSET,
    width: AURA_SIZE,
    height: AURA_SIZE,
  },
  core: {
    position: "absolute",
    left: CORE_OFFSET,
    top: CORE_OFFSET,
    width: CORE_SIZE,
    height: CORE_SIZE,
    borderRadius: CORE_SIZE / 2,
    backgroundColor: "rgba(255, 250, 205, 0.62)",
    shadowColor: "#fff3a1",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 13,
    elevation: 12,
  },
  spark: {
    position: "absolute",
    width: GameElements.PIECE_SIZE * 0.48,
    height: 3,
    borderRadius: 3,
    backgroundColor: "rgba(255, 253, 226, 0.92)",
    shadowColor: "#fff1a1",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 14,
  },
  sparkOne: {
    right: -4,
    top: 8,
  },
  sparkTwo: {
    left: -4,
    bottom: 7,
  },
});
