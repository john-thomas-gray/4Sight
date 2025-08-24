import Board from "@/components/Board";
import Piece from "@/components/Piece";
import TeamWellGrid from "@/components/TeamWellGrid";
import { TEAM_ONE_COLOR, TEAM_TWO_COLOR } from "@/constants/gameElements";
import { useGameContext } from "@/context/GameContext";
import { Team } from "@/types/logic";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const TwoPlayer = () => {
  const { layout, logic } = useGameContext();

  useEffect(() => {
    logic.setGameMode("twoPlayer");
  }, [logic]);

  const teamOneWells = Object.entries(layout.wells[TEAM_ONE_COLOR]);
  const teamTwoWells = Object.entries(layout.wells[TEAM_TWO_COLOR]);

  let pieceNumber = 0;

  const renderPieces = (
    entries: [
      string,
      { pageX: number; pageY: number; width: number; height: number }
    ][],
    team: Team
  ) =>
    entries.map(([id, layout]) => (
      <Piece
        key={id}
        id={`${pieceNumber++}${team[0]}`}
        team={team}
        currentWellId={id}
        initialPosition={{
          x: layout.pageX + layout.width / 2 - 16,
          y: layout.pageY + layout.height / 2 - 16,
        }}
      />
    ));
  return (
    <View className="flex-1 flex-row items-center justify-center mt-90 bg-[#065f46]">
      <View className="flex-row justify-between">
        <TeamWellGrid team={TEAM_ONE_COLOR} />
        <Board className="mx-10" />
        <TeamWellGrid team={TEAM_TWO_COLOR} />
      </View>
      {layout.layoutReady && renderPieces(teamOneWells, TEAM_ONE_COLOR)}
      {layout.layoutReady && renderPieces(teamTwoWells, TEAM_TWO_COLOR)}
      {/* Should be own component. Piece dropping anim. */}
      {!layout.layoutReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading game board…</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  loadingText: {
    marginTop: 12,
    color: "#fff",
    fontSize: 16,
  },
});

export default TwoPlayer;
