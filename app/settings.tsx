import type { ThemeAvailability } from "@/commerce";
import BackButton from "@/components/BackButton";
import { THEME_REGISTRY } from "@/constants/themes/registry";
import { useCommerce } from "@/context/CommerceContext";
import { useSettings } from "@/context/SettingsContext";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Switch,
  Text,
  View,
} from "react-native";

const Settings = () => {
  const {
    theme,
    themeId,
    setThemeById,
    shiftPreviews,
    setShiftPreviews,
    piecePlacementPreviews,
    setPiecePlacementPreviews,
    highlightWinningMoves,
    setHighlightWinningMoves,
  } = useSettings();
  const {
    getThemeAvailability,
    purchaseTheme,
    restorePurchases,
    getProductForTheme,
  } = useCommerce();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const colors = theme.colorTheme;
  const textColor = colors.ODD_SPACE_COLOR;
  const subtextColor = colors.EVEN_SPACE_COLOR;
  const cardStyle = {
    borderColor: colors.SLOT_BORDER_COLOR,
    backgroundColor: colors.WELL_BG_COLOR_TWO,
    borderWidth: 1,
  };

  const handleThemePress = async (entryId: string) => {
    const availability = getThemeAvailability(entryId);
    if (availability === "free" || availability === "owned") {
      setThemeById(entryId);
      return;
    }
    setPurchasing(entryId);
    const result = await purchaseTheme(entryId);
    setPurchasing(null);
    if (result.status === "success") {
      setThemeById(entryId);
    } else if (result.status === "error") {
      Alert.alert("Purchase Failed", result.message);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const result = await restorePurchases();
    setRestoring(false);
    if (result.status === "success") {
      const count = result.restoredThemeIds.length;
      Alert.alert(
        "Restored",
        count > 0
          ? `${count} theme${count > 1 ? "s" : ""} restored.`
          : "No purchases to restore.",
      );
    } else {
      Alert.alert("Restore Failed", result.message);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.FELT_TOP }}>
      <View className="px-6 pt-20 pb-4 py-12">
        <View
          style={{
            position: "relative",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text className="text-4xl font-bold" style={{ color: textColor }}>
            Settings
          </Text>
          <BackButton
            variant="inline"
            textStyle={{ color: textColor }}
            imageStyle={{ tintColor: textColor }}
            style={{
              position: "absolute",
              left: 0,
              borderColor: colors.SLOT_BORDER_COLOR,
              borderWidth: 1,
            }}
          />
        </View>
      </View>

      <View className="px-6">
        <Text
          className="text-2xl font-semibold mb-3"
          style={{ color: textColor }}
        >
          Themes
        </Text>
        <View className="flex-col gap-4">
          {THEME_REGISTRY.map((entry) => {
            const availability = getThemeAvailability(entry.id);
            const isSelected = themeId === entry.id;
            const product = getProductForTheme(entry.id);
            const isPurchasing = purchasing === entry.id;

            return (
              <ThemeCard
                key={entry.id}
                label={entry.label}
                availability={availability}
                isSelected={isSelected}
                isPurchasing={isPurchasing}
                price={product?.displayPrice}
                teamOneColor={entry.theme.colorTheme.TEAM_ONE_COLOR}
                teamTwoColor={entry.theme.colorTheme.TEAM_TWO_COLOR}
                feltColor={entry.theme.colorTheme.FELT_TOP}
                textColor={textColor}
                subtextColor={subtextColor}
                cardStyle={cardStyle}
                onPress={() => handleThemePress(entry.id)}
              />
            );
          })}
        </View>

        <Pressable
          className="mt-4 items-center"
          onPress={handleRestore}
          disabled={restoring}
        >
          {restoring ? (
            <ActivityIndicator color={textColor} />
          ) : (
            <Text
              style={{ color: subtextColor, textDecorationLine: "underline" }}
            >
              Restore Purchases
            </Text>
          )}
        </Pressable>
      </View>

      <View className="px-6 mt-8">
        <Text
          className="text-2xl font-semibold mb-3"
          style={{ color: textColor }}
        >
          Gameplay
        </Text>
        <View className="flex-col gap-4">
          <SettingsToggle
            label="Gravity Shift Preview"
            description="Shows where pieces will land after a gravity shift."
            value={shiftPreviews}
            onValueChange={setShiftPreviews}
            colors={colors}
            textColor={textColor}
            subtextColor={subtextColor}
            cardStyle={cardStyle}
          />
          <SettingsToggle
            label="Piece Drop Preview"
            description="Shows where a piece would land if dropped in the selected row or column."
            value={piecePlacementPreviews}
            onValueChange={setPiecePlacementPreviews}
            colors={colors}
            textColor={textColor}
            subtextColor={subtextColor}
            cardStyle={cardStyle}
          />
          <SettingsToggle
            label="Winning Move Highlights"
            description="Highlights spaces where a drop would complete a row of four same-colored pieces."
            value={highlightWinningMoves}
            onValueChange={setHighlightWinningMoves}
            colors={colors}
            textColor={textColor}
            subtextColor={subtextColor}
            cardStyle={cardStyle}
          />
        </View>
      </View>
    </View>
  );
};

type ThemeCardProps = {
  label: string;
  availability: ThemeAvailability;
  isSelected: boolean;
  isPurchasing: boolean;
  price?: string;
  teamOneColor: string;
  teamTwoColor: string;
  feltColor: string;
  textColor: string;
  subtextColor: string;
  cardStyle: object;
  onPress: () => void;
};

const ThemeCard: React.FC<ThemeCardProps> = ({
  label,
  availability,
  isSelected,
  isPurchasing,
  price,
  teamOneColor,
  teamTwoColor,
  feltColor,
  textColor,
  subtextColor,
  cardStyle,
  onPress,
}) => {
  const statusLabel =
    availability === "free"
      ? null
      : availability === "owned"
        ? "Owned"
        : (price ?? "Locked");

  return (
    <Pressable
      className="w-full items-start justify-start rounded-lg p-4 border"
      onPress={onPress}
      disabled={isPurchasing}
      style={[cardStyle, isSelected ? { borderWidth: 2 } : null]}
    >
      <View className="flex-row items-center justify-between w-full">
        <Text className="text-2xl" style={{ color: textColor }}>
          {label}
        </Text>
        {isPurchasing ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : statusLabel ? (
          <Text style={{ color: subtextColor, fontSize: 14 }}>
            {statusLabel}
          </Text>
        ) : null}
      </View>
      <View className="flex-row gap-2 mt-3">
        <View
          className="h-4 w-4 rounded-full"
          style={{ backgroundColor: teamOneColor }}
        />
        <View
          className="h-4 w-4 rounded-full"
          style={{ backgroundColor: teamTwoColor }}
        />
        <View
          className="h-4 w-4 rounded"
          style={{ backgroundColor: feltColor, width: 24 }}
        />
      </View>
    </Pressable>
  );
};

type SettingsToggleProps = {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  colors: (typeof THEME_REGISTRY)[0]["theme"]["colorTheme"];
  textColor: string;
  subtextColor: string;
  cardStyle: object;
};

const SettingsToggle: React.FC<SettingsToggleProps> = ({
  label,
  description,
  value,
  onValueChange,
  colors,
  textColor,
  subtextColor,
  cardStyle,
}) => (
  <View className="w-full rounded-lg p-4 border" style={cardStyle}>
    <View className="flex-row items-center justify-between">
      <Text className="text-xl" style={{ color: textColor }}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: colors.EVEN_SPACE_COLOR,
          true: colors.PIECE_TO_SLOT_COLOR,
        }}
        thumbColor={colors.SLOT_FOREGROUND_COLOR}
        ios_backgroundColor={colors.EVEN_SPACE_COLOR}
      />
    </View>
    <Text className="mt-2" style={{ color: subtextColor }}>
      {description}
    </Text>
  </View>
);

export default Settings;
