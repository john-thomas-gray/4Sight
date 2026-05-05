import React, { memo, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BANNER_ENTRANCE_SPRING = {
  damping: 10,
  stiffness: 280,
  mass: 0.5,
} as const;

const BANNER_ENTER_START_Y = -220;
const BANNER_EXIT_Y = -220;
const BANNER_EXIT_MS = 180;

type Props = {
  visible: boolean;
  message: string;
  textColor: string;
  slotBorderColor: string;
  wellBgColor: string;
  attentionSignal?: number;
};

/**
 * Floating copy card for in-game tutorial steps (safe-area aware).
 * Drops in once the playfield entrance has finished, then leaves upward.
 */
const TutorialStepBanner = ({
  visible,
  message,
  textColor,
  slotBorderColor,
  wellBgColor,
  attentionSignal = 0,
}: Props) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(BANNER_ENTER_START_Y);
  const attentionScale = useSharedValue(1);
  const attentionRotateZ = useSharedValue(0);
  const edgeScale = useSharedValue(1);
  const edgeOpacity = useSharedValue(0);
  const opacity = useSharedValue(0);
  const [shouldRender, setShouldRender] = useState(visible);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousAttentionSignalRef = useRef(attentionSignal);

  useEffect(() => {
    if (visible) {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
      setShouldRender(true);
      translateY.value = BANNER_ENTER_START_Y;
      attentionScale.value = 1;
      attentionRotateZ.value = 0;
      edgeScale.value = 1;
      edgeOpacity.value = 0;
      opacity.value = 0;
      translateY.value = withSpring(0, BANNER_ENTRANCE_SPRING);
      opacity.value = withTiming(1, { duration: 120 });
      return;
    }

    if (!shouldRender) return;
    cancelAnimation(translateY);
    cancelAnimation(opacity);
    translateY.value = withTiming(BANNER_EXIT_Y, { duration: BANNER_EXIT_MS });
    opacity.value = withTiming(0, { duration: BANNER_EXIT_MS });
    exitTimerRef.current = setTimeout(() => {
      exitTimerRef.current = null;
      setShouldRender(false);
      translateY.value = BANNER_ENTER_START_Y;
      attentionScale.value = 1;
      attentionRotateZ.value = 0;
      edgeScale.value = 1;
      edgeOpacity.value = 0;
    }, BANNER_EXIT_MS);

    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, [
    visible,
    shouldRender,
    translateY,
    attentionScale,
    attentionRotateZ,
    edgeScale,
    edgeOpacity,
    opacity,
  ]);

  useEffect(() => {
    if (attentionSignal === previousAttentionSignalRef.current) return;
    previousAttentionSignalRef.current = attentionSignal;
    if (!visible || !shouldRender) return;

    cancelAnimation(attentionScale);
    cancelAnimation(attentionRotateZ);
    cancelAnimation(edgeScale);
    cancelAnimation(edgeOpacity);
    attentionScale.value = withSequence(
      withTiming(1.2, { duration: 90 }),
      withTiming(1.08, { duration: 90 }),
      withTiming(1, { duration: 170 }),
    );
    attentionRotateZ.value = withSequence(
      withTiming(-7, { duration: 40 }),
      withTiming(7, { duration: 52 }),
      withTiming(-5, { duration: 52 }),
      withTiming(4, { duration: 52 }),
      withTiming(0, { duration: 72 }),
    );
    edgeScale.value = 0.96;
    edgeScale.value = withSequence(
      withTiming(1.07, { duration: 90 }),
      withTiming(0.99, { duration: 90 }),
      withTiming(1, { duration: 170 }),
    );
    edgeOpacity.value = withSequence(
      withTiming(1, { duration: 45 }),
      withTiming(1, { duration: 220 }),
      withTiming(0, { duration: 120 }),
    );
  }, [
    attentionSignal,
    visible,
    shouldRender,
    attentionScale,
    attentionRotateZ,
    edgeScale,
    edgeOpacity,
  ]);

  const animatedCard = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const animatedText = useAnimatedStyle(() => ({
    transform: [
      { scale: attentionScale.value },
      { rotateZ: `${attentionRotateZ.value}deg` },
    ],
  }));

  const animatedEdges = useAnimatedStyle(() => ({
    opacity: edgeOpacity.value,
    transform: [{ scale: edgeScale.value }],
  }));

  if (!shouldRender) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: insets.top + 80,
        alignItems: "center",
        zIndex: 5000,
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            marginHorizontal: 24,
            maxWidth: 360,
            width: 300,
            borderRadius: 12,
            backgroundColor: "transparent",
            shadowColor: "#000",
            shadowOffset: { width: 6, height: 6 },
            shadowOpacity: 0.99,
            shadowRadius: 16,
            elevation: 9,
          },
          animatedCard,
        ]}
      >
        <View
          pointerEvents="none"
          style={{
            borderRadius: 12,
            overflow: "visible",
          }}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              {
                borderRadius: 12,
                borderWidth: 2,
                borderColor: slotBorderColor,
              },
              animatedEdges,
            ]}
          />
          <View
            pointerEvents="none"
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: slotBorderColor,
              overflow: "hidden",
            }}
          >
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: wellBgColor, opacity: 0.95 },
              ]}
            />
            <View style={{ padding: 16 }} pointerEvents="none">
              <Animated.Text
                style={[
                  {
                    color: textColor,
                    textAlign: "center",
                    fontSize: 18,
                  },
                  animatedText,
                ]}
              >
                {message}
              </Animated.Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default memo(TutorialStepBanner);
