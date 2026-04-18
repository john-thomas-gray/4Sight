import React, { memo, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BANNER_ENTRANCE_SPRING = {
  damping: 10,
  stiffness: 280,
  mass: 0.5,
} as const;

type Props = {
  visible: boolean;
  message: string;
  textColor: string;
  slotBorderColor: string;
  wellBgColor: string;
};

/**
 * Floating copy card for in-game tutorial steps (safe-area aware).
 * Springs in from a small scale when shown (matches tutorial well-fill timing).
 */
const TutorialStepBanner = ({
  visible,
  message,
  textColor,
  slotBorderColor,
  wellBgColor,
}: Props) => {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(0.08);

  useEffect(() => {
    if (visible) {
      scale.value = 0.08;
      scale.value = withSpring(1, BANNER_ENTRANCE_SPRING);
    } else {
      cancelAnimation(scale);
      scale.value = 0.08;
    }
  }, [visible, scale]);

  const animatedCard = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

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
            <Text
              style={{
                color: textColor,
                textAlign: "center",
                fontSize: 18,
              }}
            >
              {message}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default memo(TutorialStepBanner);
