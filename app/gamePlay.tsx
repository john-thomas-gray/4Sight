import Board from "@/components/Board";
import LoadingScreen from "@/components/LoadingScreen";
import Piece from "@/components/Piece";
import TeamWellGrid from "@/components/TeamWellGrid";
import { useGameContext } from "@/context/GameContext";
import { Team } from "@/types/board";
import { GameMode, Winner } from "@/types/logic";
import React, { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";

const GamePlay = () => {
  const { layout, logic, settings } = useGameContext();

  useEffect(() => {
    logic.setGameMode(GameMode.TwoPlayer);
  }, []);

  const teamOneWells = useMemo(
    () => Object.entries(layout.wells[Winner.TeamOne]),
    [layout.wells[Winner.TeamOne]]
  );

  const teamTwoWells = useMemo(
    () => Object.entries(layout.wells[Winner.TeamTwo]),
    [layout.wells[Winner.TeamTwo]]
  );

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
        id={`${pieceNumber++}`}
        team={team}
        currentWellId={id}
        initialPosition={{
          x: layout.pageX + layout.width / 2 - 16,
          y: layout.pageY + layout.height / 2 - 16,
        }}
      />
    ));
  return (
    <View
      className="flex-1 flex-row items-center justify-center mt-90"
      style={{ backgroundColor: settings.colorTheme.FELT_TOP }}
    >
      <View className="flex-row justify-between">
        <TeamWellGrid team={Winner.TeamOne} />
        <Board className="mx-10" />
        <TeamWellGrid team={Winner.TeamTwo} />
      </View>
      {layout.layoutReady && renderPieces(teamOneWells, Winner.TeamOne)}
      {layout.layoutReady && renderPieces(teamTwoWells, Winner.TeamTwo)}
      {/* Should be own component. Piece dropping anim. */}

      {!layout.layoutReady && <LoadingScreen />}
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

export default GamePlay;
