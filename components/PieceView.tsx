import { GameElements } from "@/constants";
import { PIECE_RETURN_TO_WELL_LIFT_SETTLE_MS, PIECE_RETURN_TO_WELL_LOWER_MS } from "@/animations/pieceReturnToWell";
import { PieceStatus, useGameSessionSelector } from "@/context/GameSessionContext";
import { useLayoutSelector } from "@/context/LayoutContext";
import { useSettings } from "@/context/SettingsContext";
import { useUiSelector } from "@/context/UiContext";
import { TUTORIAL_STEP_ONE_FOCUS_PIECE_ID } from "@/tutorial/gamePlayTutorialSteps";
import { Team } from "@/engine";
import React, { memo, useCallback, useEffect, useMemo } from "react";
import { ViewStyle } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import SurfaceGradient from "./SurfaceGradient";
import Glow from "./Glow";
import { usePieceGesture } from "./usePieceGesture";

type PieceViewProps = {
  id: string;
  team: Team;
  entranceOpacity?: SharedValue<number>;
  entranceTranslateX?: SharedValue<number>;
  entranceTranslateY?: SharedValue<number>;
};

function resolveShadowAnchorStyle(
  scale: number,
  lift: number,
  pieceCenterX: number,
  pieceCenterY: number,
  sunX: number,
  sunY: number,
  nearestSunDistance: number,
  farthestSunDistance: number,
  jiggleX: number,
  jiggleY: number,
) {
  "worklet";

  const sproutVisibility = Math.max(0, Math.min(1, scale));
  const sunToPieceX = pieceCenterX - sunX;
  const sunToPieceY = pieceCenterY - sunY;
  const sunDistance = Math.max(
    1,
    Math.sqrt(sunToPieceX * sunToPieceX + sunToPieceY * sunToPieceY),
  );
  const unitX = sunToPieceX / sunDistance;
  const unitY = sunToPieceY / sunDistance;
  const sunDistanceRange = Math.max(1, farthestSunDistance - nearestSunDistance);
  const distanceFromSun = Math.max(
    0,
    Math.min(1, (sunDistance - nearestSunDistance) / sunDistanceRange),
  );
  const liftedOffset = lift * (12 + distanceFromSun * 46);

  return {
    opacity: (0.18 + lift * 0.2) * sproutVisibility,
    transform: [
      { translateX: unitX * liftedOffset + jiggleX * 0.15 },
      { translateY: unitY * liftedOffset + jiggleY * 0.15 },
    ],
  };
}

function resolveShadowShapeStyle(
  scale: number,
  lift: number,
  pieceCenterX: number,
  pieceCenterY: number,
  sunX: number,
  sunY: number,
  nearestSunDistance: number,
  farthestSunDistance: number,
) {
  "worklet";

  const sproutVisibility = Math.max(0, Math.min(1, scale));
  const sunToPieceX = pieceCenterX - sunX;
  const sunToPieceY = pieceCenterY - sunY;
  const sunDistance = Math.max(
    1,
    Math.sqrt(sunToPieceX * sunToPieceX + sunToPieceY * sunToPieceY),
  );
  const unitX = sunToPieceX / sunDistance;
  const unitY = sunToPieceY / sunDistance;
  const sunDistanceRange = Math.max(1, farthestSunDistance - nearestSunDistance);
  const distanceFromSun = Math.max(
    0,
    Math.min(1, (sunDistance - nearestSunDistance) / sunDistanceRange),
  );
  const baseScale = Math.max(0.22, (0.65 + lift * 2.15) * sproutVisibility);
  const castStretch = 0.2 + distanceFromSun * 1.12;

  return {
    transform: [
      { rotate: `${Math.atan2(unitY, unitX)}rad` },
      { scaleX: baseScale * (1 + lift * castStretch) },
      { scaleY: baseScale * (1 + lift * 0.06) },
    ],
  };
}

const PieceView: React.FC<PieceViewProps> = ({
  id,
  team,
  entranceOpacity,
  entranceTranslateX,
  entranceTranslateY,
}) => {
  const { animate, status, currentWellEntry } = useGameSessionSelector(session => ({
    animate: session.pieceAnims[id], status: session.pieceStatusMap[id] ?? PieceStatus.inWell,
    currentWellEntry: session.pieceWellLocations[id] ?? null,
  }));
  const shadowSun = useLayoutSelector(layout => layout.shadowSun);
  const { theme } = useSettings();
  const { isPreviewingGravity, tutorialWellPieceIdlePulseActive, tutorialWellPiecePulseScale } = useUiSelector(ui => ({
    isPreviewingGravity: ui.isPreviewingGravity,
    tutorialWellPieceIdlePulseActive: ui.tutorialWellPieceIdlePulseActive,
    tutorialWellPiecePulseScale: ui.tutorialWellPiecePulseScale,
  }));
  const heldJiggleRotation = useSharedValue(0);
  const heldJiggleX = useSharedValue(0);
  const heldJiggleY = useSharedValue(0);
  const pieceLift = useSharedValue(0);

  const isBoardResident =
    status === PieceStatus.onBoard || status === PieceStatus.winner;
  const hiddenByPreview = isPreviewingGravity && isBoardResident;

  useEffect(() => {
    if (!animate) return;
    animate.winnerColor.set(team === Team.One
        ? theme.colorTheme.TEAM_ONE_WINNER_COLOR
        : theme.colorTheme.TEAM_TWO_WINNER_COLOR);
    if (status === PieceStatus.winner) {
      animate.color.set(animate.winnerColor.value);
      return;
    }
    animate.color.set(team === Team.One
        ? theme.colorTheme.TEAM_ONE_COLOR
        : theme.colorTheme.TEAM_TWO_COLOR);
  }, [animate, team, theme, status]);

  const hiddenOffWell =
    status === PieceStatus.inWell && currentWellEntry === null;

  const applyTutorialWellIdlePulse =
    id === TUTORIAL_STEP_ONE_FOCUS_PIECE_ID &&
    status === PieceStatus.inWell &&
    tutorialWellPieceIdlePulseActive;

  const shadowGradientId = useMemo(() => `piece-shadow-${id}`, [id]);

  const startHeldJiggle = useCallback(() => {
    heldJiggleRotation.set(0);
    heldJiggleX.set(0);
    heldJiggleY.set(0);
    cancelAnimation(pieceLift);
    pieceLift.set(withTiming(1, {
      duration: 140,
      easing: Easing.out(Easing.quad),
    }));
    heldJiggleRotation.set(withRepeat(
      withSequence(
        withTiming(-7, {
          duration: 55,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(7, {
          duration: 95,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(0, {
          duration: 55,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      -1,
      false,
    ));
    heldJiggleX.set(withRepeat(
      withSequence(
        withTiming(-2, { duration: 55, easing: Easing.inOut(Easing.quad) }),
        withTiming(2, { duration: 95, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 55, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    ));
    heldJiggleY.set(withRepeat(
      withSequence(
        withTiming(1.2, { duration: 55, easing: Easing.inOut(Easing.quad) }),
        withTiming(-1.2, { duration: 95, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 55, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    ));
  }, [heldJiggleRotation, heldJiggleX, heldJiggleY, pieceLift]);

  const stopHeldJiggle = useCallback(() => {
    cancelAnimation(heldJiggleRotation);
    cancelAnimation(heldJiggleX);
    cancelAnimation(heldJiggleY);
    heldJiggleRotation.set(withTiming(0, {
      duration: 80,
      easing: Easing.out(Easing.quad),
    }));
    heldJiggleX.set(withTiming(0, {
      duration: 80,
      easing: Easing.out(Easing.quad),
    }));
    heldJiggleY.set(withTiming(0, {
      duration: 80,
      easing: Easing.out(Easing.quad),
    }));
  }, [heldJiggleRotation, heldJiggleX, heldJiggleY]);

  const reversePieceLift = useCallback(
    (duration: number, delayMs = 0) => {
      cancelAnimation(pieceLift);
      const descend = withTiming(0, {
        duration,
        easing: Easing.inOut(Easing.quad),
      });
      pieceLift.set(delayMs > 0 ? withDelay(delayMs, descend) : descend);
    },
    [pieceLift],
  );

  const returnPieceLiftToWell = useCallback(
    (holdMs: number) => {
      cancelAnimation(pieceLift);
      const descend = withTiming(0, {
        duration: PIECE_RETURN_TO_WELL_LOWER_MS,
        easing: Easing.inOut(Easing.quad),
      });

      if (holdMs <= 0) {
        pieceLift.set(descend);
        return;
      }

      const liftSettleMs = Math.min(
        PIECE_RETURN_TO_WELL_LIFT_SETTLE_MS,
        holdMs,
      );
      const holdAtLiftMs = holdMs - liftSettleMs;

      pieceLift.set(holdAtLiftMs > 0
          ? withSequence(
              withTiming(1, {
                duration: liftSettleMs,
                easing: Easing.out(Easing.quad),
              }),
              withTiming(1, { duration: holdAtLiftMs }),
              descend,
            )
          : withSequence(
              withTiming(1, {
                duration: liftSettleMs,
                easing: Easing.out(Easing.quad),
              }),
              descend,
            ));
    },
    [pieceLift],
  );

  const movePiece = usePieceGesture({ id, team, animate, status, startHeldJiggle, stopHeldJiggle, reversePieceLift, returnPieceLiftToWell });

  const piecePositionStyle = useAnimatedStyle(
    () => ({
      opacity:
        hiddenByPreview || hiddenOffWell ? 0 : entranceOpacity?.value ?? 1,
      transform: [
        {
          translateX:
            animate.translateX.value + (entranceTranslateX?.value ?? 0),
        },
        {
          translateY:
            animate.translateY.value + (entranceTranslateY?.value ?? 0),
        },
      ],
      zIndex: animate.zIndex.value,
    }),
    [
      animate,
      entranceOpacity,
      entranceTranslateX,
      entranceTranslateY,
      hiddenByPreview,
      hiddenOffWell,
    ],
  );

  const pieceShadowAnchorStyle = useAnimatedStyle(() => {
    const pulse = applyTutorialWellIdlePulse
      ? tutorialWellPiecePulseScale.value
      : 1;
    return resolveShadowAnchorStyle(
      Math.max(animate.scaleX.value, animate.scaleY.value) * pulse,
      Math.max(0, Math.min(1, pieceLift.value)),
      animate.translateX.value + GameElements.PIECE_RADIUS,
      animate.translateY.value + GameElements.PIECE_RADIUS,
      shadowSun.x,
      shadowSun.y,
      shadowSun.nearestDistance,
      shadowSun.farthestDistance,
      heldJiggleX.value,
      heldJiggleY.value,
    );
  }, [
    applyTutorialWellIdlePulse,
    animate,
    heldJiggleX,
    heldJiggleY,
    pieceLift,
    shadowSun,
    tutorialWellPiecePulseScale,
  ]);

  const pieceShadowShapeStyle = useAnimatedStyle(() => {
    const pulse = applyTutorialWellIdlePulse
      ? tutorialWellPiecePulseScale.value
      : 1;
    return resolveShadowShapeStyle(
      Math.max(animate.scaleX.value, animate.scaleY.value) * pulse,
      Math.max(0, Math.min(1, pieceLift.value)),
      animate.translateX.value + GameElements.PIECE_RADIUS,
      animate.translateY.value + GameElements.PIECE_RADIUS,
      shadowSun.x,
      shadowSun.y,
      shadowSun.nearestDistance,
      shadowSun.farthestDistance,
    );
  }, [
    applyTutorialWellIdlePulse,
    animate,
    pieceLift,
    shadowSun,
    tutorialWellPiecePulseScale,
  ]);

  const pieceFaceStyle = useAnimatedStyle(() => {
    const pulse = applyTutorialWellIdlePulse
      ? tutorialWellPiecePulseScale.value
      : 1;
    return {
      transform: [
        { translateX: heldJiggleX.value },
        { translateY: heldJiggleY.value },
        { rotate: `${heldJiggleRotation.value}deg` },
        { scaleX: animate.scaleX.value * pulse },
        { scaleY: animate.scaleY.value * pulse },
      ],
      backgroundColor: animate.color.value,
    };
  }, [
    applyTutorialWellIdlePulse,
    animate,
    heldJiggleRotation,
    heldJiggleX,
    heldJiggleY,
    tutorialWellPiecePulseScale,
  ]);

  const positionStyle: ViewStyle = {
    height: GameElements.PIECE_SIZE,
    width: GameElements.PIECE_SIZE,
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "visible",
  };

  const shadowStyle: ViewStyle = {
    position: "absolute",
    left: GameElements.PIECE_SIZE * 0.1875,
    top: GameElements.PIECE_SIZE * 0.1875,
    width: GameElements.PIECE_SIZE * 0.625,
    height: GameElements.PIECE_SIZE * 0.625,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  };

  const shadowShapeStyle: ViewStyle = {
    width: GameElements.PIECE_SIZE * 0.625,
    height: GameElements.PIECE_SIZE * 0.625,
    overflow: "visible",
  };

  const faceStyle: ViewStyle = {
    height: GameElements.PIECE_SIZE,
    width: GameElements.PIECE_SIZE,
    borderRadius: GameElements.PIECE_RADIUS,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  };

  const pieceNode = (
    <Animated.View
      testID={`piece-${id}`}
      pointerEvents={isBoardResident || hiddenOffWell ? "none" : "auto"}
      style={[
        positionStyle,
        piecePositionStyle,
        status === PieceStatus.inWell
          ? { zIndex: GameElements.PIECE_WELL_ZINDEX }
          : null,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[shadowStyle, pieceShadowAnchorStyle]}
      >
        <Animated.View style={[shadowShapeStyle, pieceShadowShapeStyle]}>
          <Svg height="100%" width="100%" viewBox="0 0 64 64">
            <Defs>
              <RadialGradient
                id={shadowGradientId}
                cx="38%"
                cy="50%"
                r="72%"
              >
                <Stop offset="0" stopColor="black" stopOpacity="0.72" />
                <Stop offset="0.48" stopColor="black" stopOpacity="0.28" />
                <Stop offset="0.78" stopColor="black" stopOpacity="0.08" />
                <Stop offset="1" stopColor="black" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle
              cx="32"
              cy="32"
              r="31"
              fill={`url(#${shadowGradientId})`}
            />
          </Svg>
        </Animated.View>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[faceStyle, pieceFaceStyle]}
      >
        <SurfaceGradient
          variant="raised"
          borderRadius={GameElements.PIECE_RADIUS - 2}
        />
        <Glow pieceId={id} />
        <Animated.View
          style={{
            position: "absolute",
            top: GameElements.PIECE_SIZE * 0.2,
            right: GameElements.PIECE_SIZE * 0.1,
            width: GameElements.PIECE_SIZE * 0.4,
            height: GameElements.PIECE_SIZE * 0.2,
            borderRadius: GameElements.PIECE_RADIUS,
            backgroundColor: "rgba(200, 200, 200, 0.6)",
            transform: [{ rotate: "40deg" }],
            zIndex: 1,
          }}
        />
      </Animated.View>
    </Animated.View>
  );

  if (isBoardResident || hiddenOffWell) return pieceNode;

  return <GestureDetector gesture={movePiece}>{pieceNode}</GestureDetector>;
};

export default memo(PieceView);
