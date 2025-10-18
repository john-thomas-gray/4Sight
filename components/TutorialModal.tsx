import React from "react";
import { Pressable, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type TutorialModalProps = {
  visible: boolean;
  text: string;
  onPress?: () => void;
};

const TutorialModal = ({ visible, text, onPress }: TutorialModalProps) => {
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 250 });
  }, [visible]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        style,
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        android_ripple={{ color: "#D1D5DB" }}
        style={{
          backgroundColor: "#111827",
          borderRadius: 12,
          paddingVertical: 16,
          paddingHorizontal: 20,
          maxWidth: "84%",
        }}
      >
        <Text style={{ color: "white", fontSize: 18, textAlign: "center" }}>
          {text}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export default TutorialModal;
