import BackButton from "@/components/BackButton";
import { CLASSIC } from "@/constants/themes/classic";
import { SCHOOLHOUSE } from "@/constants/themes/schoolhouse";
import { useGameContext } from "@/context/GameContext";
import React from "react";
import { Pressable, Switch, Text, View } from "react-native";

const Settings = () => {
  const { settings } = useGameContext();
  const isSameTheme = (a: typeof CLASSIC | undefined, b: typeof CLASSIC) => {
    if (!a || !a.colorTheme) return false;
    return (
      a.colorTheme.TEAM_ONE_COLOR === b.colorTheme.TEAM_ONE_COLOR &&
      a.colorTheme.TEAM_TWO_COLOR === b.colorTheme.TEAM_TWO_COLOR &&
      a.colorTheme.FELT_TOP === b.colorTheme.FELT_TOP
    );
  };
  const isClassicSelected = isSameTheme(settings.theme, CLASSIC);
  const isSchoolhouseSelected = isSameTheme(settings.theme, SCHOOLHOUSE);

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: settings.theme?.colorTheme?.FELT_TOP || "#222",
      }}
    >
      <View className="px-6 pt-20 pb-4 py-12">
        <View
          style={{
            position: "relative",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            className="text-4xl font-bold"
            style={{
              color: settings.theme?.colorTheme?.ODD_SPACE_COLOR || "#fff",
            }}
          >
            Settings
          </Text>
          <BackButton
            variant="inline"
            textStyle={{
              color: settings.theme?.colorTheme?.ODD_SPACE_COLOR || "#fff",
            }}
            imageStyle={{
              tintColor: settings.theme?.colorTheme?.ODD_SPACE_COLOR || "#fff",
            }}
            style={{
              position: "absolute",
              left: 0,
              borderColor: settings.theme?.colorTheme?.SLOT_BORDER_COLOR,
              borderWidth: 1,
            }}
          />
        </View>
      </View>

      <View className="px-6">
        <Text
          className="text-2xl font-semibold mb-3"
          style={{
            color: settings.theme?.colorTheme?.ODD_SPACE_COLOR || "#fff",
          }}
        >
          Themes
        </Text>
        <View className="flex-col gap-4">
          <Pressable
            className={`w-full items-start justify-start rounded-lg p-4 border`}
            onPress={() => settings.setTheme(CLASSIC)}
            style={{
              borderColor: settings.theme?.colorTheme?.SLOT_BORDER_COLOR,
              backgroundColor: settings.theme?.colorTheme?.WELL_BG_COLOR_TWO,
              borderWidth: 1,
            }}
          >
            <Text
              className="text-2xl"
              style={{
                color: settings.theme?.colorTheme?.ODD_SPACE_COLOR || "#fff",
              }}
            >
              Classic
            </Text>
            <View className="flex-row gap-2 mt-3">
              <View
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: CLASSIC.colorTheme.TEAM_ONE_COLOR }}
              />
              <View
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: CLASSIC.colorTheme.TEAM_TWO_COLOR }}
              />
              <View
                className="h-4 w-4 rounded"
                style={{
                  backgroundColor: CLASSIC.colorTheme.FELT_TOP,
                  width: 24,
                }}
              />
            </View>
          </Pressable>

          <Pressable
            className={`w-full items-start justify-start rounded-lg p-4 border`}
            onPress={() => settings.setTheme(SCHOOLHOUSE)}
            android_ripple={{
              color: settings.theme?.colorTheme?.SLOT_BORDER_COLOR || "#888",
            }}
            style={{
              borderColor: settings.theme?.colorTheme?.SLOT_BORDER_COLOR,
              backgroundColor: settings.theme?.colorTheme?.WELL_BG_COLOR_TWO,
              borderWidth: 1,
            }}
          >
            <Text
              className="text-2xl"
              style={{
                color: settings.theme?.colorTheme?.ODD_SPACE_COLOR || "#fff",
              }}
            >
              Schoolhouse
            </Text>
            <View className="flex-row gap-2 mt-3">
              <View
                className="h-4 w-4 rounded-full"
                style={{
                  backgroundColor: SCHOOLHOUSE.colorTheme.TEAM_ONE_COLOR,
                }}
              />
              <View
                className="h-4 w-4 rounded-full"
                style={{
                  backgroundColor: SCHOOLHOUSE.colorTheme.TEAM_TWO_COLOR,
                }}
              />
              <View
                className="h-4 w-4 rounded"
                style={{
                  backgroundColor: SCHOOLHOUSE.colorTheme.FELT_TOP,
                  width: 24,
                }}
              />
            </View>
          </Pressable>
        </View>
      </View>
      <View className="px-6 mt-8">
        <Text
          className="text-2xl font-semibold mb-3"
          style={{
            color: settings.theme?.colorTheme?.ODD_SPACE_COLOR || "#fff",
          }}
        >
          Gameplay
        </Text>
        <View className="flex-col gap-4">
          <View
            className="w-full rounded-lg p-4 border"
            style={{
              borderColor: settings.theme?.colorTheme?.SLOT_BORDER_COLOR,
              backgroundColor: settings.theme?.colorTheme?.WELL_BG_COLOR_TWO,
              borderWidth: 1,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Text
                className="text-xl"
                style={{
                  color: settings.theme?.colorTheme?.ODD_SPACE_COLOR || "#fff",
                }}
              >
                Gravity Shift Preview
              </Text>
              <Switch
                value={settings.shiftPreviews}
                onValueChange={settings.setShiftPreviews}
                trackColor={{
                  false: settings.theme?.colorTheme?.EVEN_SPACE_COLOR,
                  true: settings.theme?.colorTheme?.PIECE_TO_SLOT_COLOR,
                }}
                thumbColor={settings.theme?.colorTheme?.SLOT_FOREGROUND_COLOR}
                ios_backgroundColor={
                  settings.theme?.colorTheme?.EVEN_SPACE_COLOR
                }
              />
            </View>
            <Text
              className="mt-2"
              style={{
                color: settings.theme?.colorTheme?.EVEN_SPACE_COLOR || "#ccc",
              }}
            >
              Shows where pieces will land after a gravity shift.
            </Text>
          </View>

          <View
            className="w-full rounded-lg p-4 border"
            style={{
              borderColor: settings.theme?.colorTheme?.SLOT_BORDER_COLOR,
              backgroundColor: settings.theme?.colorTheme?.WELL_BG_COLOR_TWO,
              borderWidth: 1,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Text
                className="text-xl"
                style={{
                  color: settings.theme?.colorTheme?.ODD_SPACE_COLOR || "#fff",
                }}
              >
                Piece Drop Preview
              </Text>
              <Switch
                value={settings.piecePlacementPreviews}
                onValueChange={settings.setPiecePlacementPreviews}
                trackColor={{
                  false: settings.theme?.colorTheme?.EVEN_SPACE_COLOR,
                  true: settings.theme?.colorTheme?.PIECE_TO_SLOT_COLOR,
                }}
                thumbColor={settings.theme?.colorTheme?.SLOT_FOREGROUND_COLOR}
                ios_backgroundColor={
                  settings.theme?.colorTheme?.EVEN_SPACE_COLOR
                }
              />
            </View>
            <Text
              className="mt-2"
              style={{
                color: settings.theme?.colorTheme?.EVEN_SPACE_COLOR || "#ccc",
              }}
            >
              Shows where a piece would land if dropped in the selected row or
              column.
            </Text>
          </View>

          <View
            className="w-full rounded-lg p-4 border"
            style={{
              borderColor: settings.theme?.colorTheme?.SLOT_BORDER_COLOR,
              backgroundColor: settings.theme?.colorTheme?.WELL_BG_COLOR_TWO,
              borderWidth: 1,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Text
                className="text-xl"
                style={{
                  color: settings.theme?.colorTheme?.ODD_SPACE_COLOR || "#fff",
                }}
              >
                Winning Move Highlights
              </Text>
              <Switch
                value={settings.highlightWinningMoves}
                onValueChange={settings.setHighlightWinningMoves}
                trackColor={{
                  false: settings.theme?.colorTheme?.EVEN_SPACE_COLOR,
                  true: settings.theme?.colorTheme?.PIECE_TO_SLOT_COLOR,
                }}
                thumbColor={settings.theme?.colorTheme?.SLOT_FOREGROUND_COLOR}
                ios_backgroundColor={
                  settings.theme?.colorTheme?.EVEN_SPACE_COLOR
                }
              />
            </View>
            <Text
              className="mt-2"
              style={{
                color: settings.theme?.colorTheme?.EVEN_SPACE_COLOR || "#ccc",
              }}
            >
              Highlights spaces where a drop would complete a row of four
              same-colored pieces.
            </Text>
          </View>
        </View>
      </View>
      {/* Removed floating back button, now inline in header */}
    </View>
  );
};

export default Settings;
