import { useSettings } from "@/context/SettingsContext";
import React from "react";
import { Pressable, View } from "react-native";

interface HamburgerMenuProps {
  onPress: () => void;
  size?: number;
  className?: string;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  onPress,
  size = 24,
  className,
}) => {
  const { colorTheme } = useSettings();

  return (
    <Pressable
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Menu"
      className={`p-2.5 rounded-full border-2 ${className || ""}`}
      style={{ borderColor: colorTheme.ODD_SPACE_COLOR }}
    >
      <View
        style={{
          width: size,
          height: size,
          justifyContent: "space-between",
        }}
      >
        {/* Top line */}
        <View
          style={{
            width: "100%",
            height: 3,
            backgroundColor: colorTheme.ODD_SPACE_COLOR,
            borderRadius: 1.5,
          }}
        />
        {/* Middle line */}
        <View
          style={{
            width: "100%",
            height: 3,
            backgroundColor: colorTheme.ODD_SPACE_COLOR,
            borderRadius: 1.5,
          }}
        />
        {/* Bottom line */}
        <View
          style={{
            width: "100%",
            height: 3,
            backgroundColor: colorTheme.ODD_SPACE_COLOR,
            borderRadius: 1.5,
          }}
        />
      </View>
    </Pressable>
  );
};

export default HamburgerMenu;
