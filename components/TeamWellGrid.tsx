import { GameElements } from "@/constants";
import { useGameContext } from "@/context/GameContext";
import { CellType, Team } from "@/types/board";
import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import Well from "./Well";

type TeamWellGridProps = {
  team: Team;
};

const COLS = 8;
const ROWS = 3;

const TeamWellGrid = ({ team }: TeamWellGridProps) => {
  const { settings } = useGameContext();
  const borderColor =
    team === Team.TeamOne
      ? settings.colorTheme.TEAM_ONE_COLOR
      : settings.colorTheme.TEAM_TWO_COLOR;
  const idNumOffset =
    team === Team.TeamOne ? { row: 9, col: 9 } : { row: 17, col: 12 };

  return (
    <View style={[styles.container, { borderColor }]}>
      {Array.from({ length: ROWS }).map((_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: COLS }).map((_, col) => {
            const id = `${row + idNumOffset.row}-${col + idNumOffset.col}`;
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
    width: (COLS - 0.5) * 47,
    height: ROWS * 47,
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
