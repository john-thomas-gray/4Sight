import {
  BASE_CELL_SIZE,
  TEAM_ONE_COLOR,
  TEAM_TWO_COLOR,
} from "@/constants/gameElements";
import { Team } from "@/types/logic";
import React from "react";
import { StyleSheet, View } from "react-native";
import Well from "./Well";

type TeamWellGridProps = {
  team: Team;
};

const COLS = 3;
const ROWS = 8;

const TeamWellGrid = ({ team }: TeamWellGridProps) => {
  const borderColor = team === TEAM_ONE_COLOR ? TEAM_ONE_COLOR : TEAM_TWO_COLOR;
  const idNumOffset =
    team === TEAM_ONE_COLOR ? { row: 9, col: 9 } : { row: 17, col: 12 };

  return (
    <View style={[styles.container, { borderColor }]}>
      {Array.from({ length: ROWS }).map((_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: COLS }).map((_, col) => {
            const id = `${row + idNumOffset.row}-${col + idNumOffset.col}`;
            return <Well key={id} id={id} type="well" team={team} />;
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: COLS * 47,
    height: 352,
    borderWidth: 4,
    paddingHorizontal: 4,
    paddingTop: 5,
    paddingBottom: 5,
    backgroundColor: "#031e16ff",
    borderRadius: 8,
    gap: 2,
  },
  row: {
    flexDirection: "row",
    height: BASE_CELL_SIZE,
  },
});

export default TeamWellGrid;
