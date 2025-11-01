import { useLogicBoardState } from "@/context/LogicContext";
import { PieceStatus } from "@/types/logic";
import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";

type TutorialModalProps = {
  visible: boolean;
  text: string;
  timeoutMS?: number;
  onPress?: () => void;
  // Optional action buttons
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  emphasizePrimary?: boolean;
  dismissOnOverlayPress?: boolean;
  // Optional external override for whether a piece is currently held
  isHoldingPiece?: boolean;
  // Allow touches to pass through outside the modal content
  allowThrough?: boolean;
  // Transparency controls
  fadeOnHolding?: boolean;
  transparentOpacity?: number; // 0..1 when faded
  transparentFadeMs?: number; // fade-out duration
  restoreFadeMs?: number; // fade-in duration
};

const TutorialModal = ({
  visible,
  text,
  timeoutMS,
  onPress,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  emphasizePrimary = false,
  dismissOnOverlayPress = true,
  isHoldingPiece,
  allowThrough = false,
  fadeOnHolding = false,
  transparentOpacity = 0.08,
  transparentFadeMs = 160,
  restoreFadeMs = 200,
}: TutorialModalProps) => {
  const { pieceStatusMap } = useLogicBoardState();
  const opacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const contentScale = useSharedValue(0);
  const contentPulseScale = useSharedValue(1);
  const anyHeld = React.useMemo(
    () =>
      Object.values(pieceStatusMap || {}).some((s) => s === PieceStatus.isHeld),
    [pieceStatusMap]
  );
  const holding = isHoldingPiece ?? anyHeld;
  const containerOpacity = useSharedValue(1);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      contentScale.value = 0;
      contentScale.value = withSpring(
        1,
        {
          damping: 12,
          stiffness: 220,
          mass: 0.6,
          overshootClamping: false,
        },
        () => {
          // Start pulsing after pop-in completes (unaffected by holding)
          contentPulseScale.value = withRepeat(
            withTiming(1.02, {
              duration: 1400,
              easing: Easing.inOut(Easing.quad),
            }),
            -1,
            true
          );
          // Primary button pulse if emphasized
          if (emphasizePrimary && primaryLabel) {
            pulseScale.value = withRepeat(
              withTiming(1.06, {
                duration: 900,
                easing: Easing.inOut(Easing.quad),
              }),
              -1,
              true
            );
          }
        }
      );
    } else {
      // Reset when hiding
      opacity.value = withTiming(0, { duration: 150 });
      contentScale.value = withTiming(0, { duration: 100 });
      pulseScale.value = withTiming(1, { duration: 100 });
      contentPulseScale.value = withTiming(1, { duration: 100 });
    }
  }, [
    visible,
    opacity,
    contentScale,
    contentPulseScale,
    pulseScale,
    emphasizePrimary,
    primaryLabel,
  ]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value * containerOpacity.value,
  }));
  const contentStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: contentScale.value },
      { scale: contentPulseScale.value },
    ],
  }));
  const primaryPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  // Safety: stop pulse if emphasis is removed while visible
  React.useEffect(() => {
    if (!visible || !emphasizePrimary || !primaryLabel) {
      pulseScale.value = withTiming(1, { duration: 120 });
    }
  }, [visible, emphasizePrimary, primaryLabel, pulseScale]);

  // Fade container transparency based on holding state if enabled
  React.useEffect(() => {
    if (!visible) return;
    if (!fadeOnHolding) {
      containerOpacity.value = withTiming(1, {
        duration: restoreFadeMs,
        easing: Easing.inOut(Easing.quad),
      });
      return;
    }
    const target = holding ? Math.max(0, Math.min(1, transparentOpacity)) : 1;
    containerOpacity.value = withTiming(target, {
      duration: holding ? transparentFadeMs : restoreFadeMs,
      easing: Easing.inOut(Easing.quad),
    });
  }, [
    visible,
    fadeOnHolding,
    holding,
    transparentOpacity,
    transparentFadeMs,
    restoreFadeMs,
    containerOpacity,
  ]);

  React.useEffect(() => {
    if (!visible) return;
    if (!timeoutMS) return;
    const timeoutId = setTimeout(() => {
      opacity.value = withTiming(visible ? 1 : 0, {
        duration: 250 + timeoutMS,
      });
    });
    return () => clearTimeout(timeoutId);
  }, [visible, timeoutMS, opacity]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents={visible ? (allowThrough ? "box-none" : "auto") : "none"}
      style={[
        style,
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 120,
          zIndex: 2000,
        },
      ]}
    >
      <Pressable
        pointerEvents={allowThrough ? "box-none" : "auto"}
        onPress={dismissOnOverlayPress ? onPress : undefined}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Animated.View
          style={[
            contentStyle,
            {
              backgroundColor: "#111827",
              borderRadius: 12,
              paddingVertical: 16,
              paddingHorizontal: 20,
              maxWidth: "84%",
            },
          ]}
        >
          <Text style={{ color: "white", fontSize: 18, textAlign: "center" }}>
            {text}
          </Text>

          {(primaryLabel || secondaryLabel) && (
            <View
              style={{
                marginTop: 16,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 12,
              }}
            >
              {secondaryLabel && (
                <Pressable
                  onPress={onSecondary}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    backgroundColor: "#374151",
                  }}
                >
                  <Text style={{ color: "#E5E7EB", fontSize: 16 }}>
                    {secondaryLabel}
                  </Text>
                </Pressable>
              )}
              {primaryLabel && (
                <Animated.View
                  style={emphasizePrimary ? primaryPulseStyle : undefined}
                >
                  <Pressable
                    onPress={onPrimary}
                    style={{
                      paddingVertical: emphasizePrimary ? 12 : 10,
                      paddingHorizontal: emphasizePrimary ? 22 : 16,
                      borderRadius: 10,
                      backgroundColor: "#10B981", // emerald-500
                      borderWidth: emphasizePrimary ? 2 : 0,
                      borderColor: emphasizePrimary ? "#34D399" : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        color: "#052e16",
                        fontSize: emphasizePrimary ? 18 : 16,
                        fontWeight: emphasizePrimary ? "700" : "600",
                      }}
                    >
                      {primaryLabel}
                    </Text>
                  </Pressable>
                </Animated.View>
              )}
            </View>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

export default TutorialModal;
