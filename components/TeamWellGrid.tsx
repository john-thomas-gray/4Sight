import { GameElements } from "@/constants";
import { useSettings } from "@/context/SettingsContext";
import { Team } from "@/engine";
import { CellType } from "@/types/board";
import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import Well from "./Well";

type TeamWellGridProps = {
  team: Team;
};

const ROWS = 8;
const COLS = 3;

const TeamWellGrid = ({ team }: TeamWellGridProps) => {
  const { theme } = useSettings();
  const borderColor =
    team === Team.One
      ? theme.colorTheme.TEAM_ONE_COLOR
      : theme.colorTheme.TEAM_TWO_COLOR;
  const rowOffset = team === Team.One ? 9 : 17;
  const columnOffset = team === Team.One ? 9 : 12;

  return (
    <View style={[styles.container, { borderColor }]}>
      {Array.from({ length: COLS }).map((_, col) => (
        <View key={col} style={styles.row}>
          {Array.from({ length: ROWS }).map((_, row) => {
            const rowId = row + rowOffset;
            const columnId = col + columnOffset;
            const id = `${rowId}-${columnId}`;
            return <Well key={id} id={id} type={CellType.Well} team={team} />;
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: (ROWS - 0.5) * 47,
    height: COLS * 47,
    borderWidth: 4,
    paddingHorizontal: 5,
    paddingTop: 4,
    paddingBottom: 5,
    backgroundColor: "#031e16ff",
    borderRadius: 8,
    gap: 2,
  },
  row: {
    flexDirection: "row",
    height: GameElements.BASE_CELL_SIZE,
  },
});

export default memo(TeamWellGrid);
