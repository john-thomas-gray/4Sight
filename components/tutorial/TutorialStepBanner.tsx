import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  message: string;
  textColor: string;
  slotBorderColor: string;
  wellBgColor: string;
};

/**
 * Floating copy card for in-game tutorial steps (safe-area aware).
 */
const TutorialStepBanner = ({
  visible,
  message,
  textColor,
  slotBorderColor,
  wellBgColor,
}: Props) => {
  const insets = useSafeAreaInsets();

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
      <View
        pointerEvents="none"
        style={{
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
        }}
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
      </View>
    </View>
  );
};

export default memo(TutorialStepBanner);
