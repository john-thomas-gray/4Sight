import { useGameContext } from "@/context/GameContext";
import React from "react";
import { StyleSheet, View } from "react-native";
import WellSpace from "./WellSpace";

type PieceWellProps = {
  team: "white" | "black";
  className?: string;
};

const COLS = 3;
const ROWS = 8;

const PieceWell = ({ team, className }: PieceWellProps) => {
  const borderColor = team === "white" ? "white" : "black";
  const { registerWellSpace } = useGameContext();

  return (
    <View className={className}>
      <View style={[styles.container, { borderColor }]}>
        {Array.from({ length: ROWS }).map((_, row) => (
          <View key={row} style={styles.row}>
            {Array.from({ length: COLS }).map((_, col) => {
              const id = `${team}-${row}-${col}`;
              return (
                <WellSpace
                  key={id}
                  id={id}
                  register={(id, layout) => registerWellSpace(team, id, layout)}
                />
              );
            })}
          </View>
        ))}
      </View>
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
    backgroundColor: "#065f46",
    borderRadius: 8,
    gap: 2,
  },
  row: {
    flexDirection: "row",
    height: 40,
  },
});

export default PieceWell;
