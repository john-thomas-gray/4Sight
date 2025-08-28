import Board from "@/components/Board";
import LoadingScreen from "@/components/LoadingScreen";
import Piece from "@/components/Piece";
import TeamWellGrid from "@/components/TeamWellGrid";
import { useGameContext } from "@/context/GameContext";
import { PieceProps, Team } from "@/types/board";
import React, { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";

// type PieceProps = {
//    team: Team;
//    id: string;
//    initialPosition: { x: number; y: number };
//    currentWellId?: string;
//  };

const GamePlay = () => {
  const { layout, settings } = useGameContext();

  const teamOneWells = useMemo(
    () => Object.entries(layout.wells[Team.TeamOne]),
    [layout.wells[Team.TeamOne]]
  );

  const teamTwoWells = useMemo(
    () => Object.entries(layout.wells[Team.TeamTwo]),
    [layout.wells[Team.TeamTwo]]
  );

  const initialized = useRef(false);

  const toPieces = (
    entries: [
      string,
      { pageX: number; pageY: number; width: number; height: number }
    ][],
    team: Team,
    startIdx: number
  ): Record<string, PieceProps> =>
    Object.fromEntries(
      entries.map(([wellId, l], idx) => {
        const id = `${startIdx + idx}`; // global index
        const initialPosition = {
          x: l.pageX + l.width / 2 - 16,
          y: l.pageY + l.height / 2 - 16,
        };
        return [id, { id, team, currentWellId: wellId, initialPosition }];
      })
    );

  useEffect(() => {
    if (!layout.layoutReady || initialized.current) return;

    const built = {
      ...toPieces(teamOneWells, Team.TeamOne, 0),
      ...toPieces(teamTwoWells, Team.TeamTwo, 24),
    };
    layout.setPieces(built);
    initialized.current = true;
  }, [layout.layoutReady, teamOneWells, teamTwoWells]);

  const renderPieces = (piecesRecord: Record<string, PieceProps>) =>
    Object.entries(piecesRecord).map(([id, p]) => (
      <Piece
        key={id}
        id={id}
        team={p.team}
        currentWellId={p.currentWellId}
        initialPosition={p.initialPosition}
      />
    ));

  return (
    <View
      className="flex-1 flex-row items-center justify-center mt-90"
      style={{ backgroundColor: settings.colorTheme.FELT_TOP }}
    >
      <View className="flex-row justify-between">
        <TeamWellGrid team={Team.TeamOne} />
        <Board className="mx-10" />
        <TeamWellGrid team={Team.TeamTwo} />
      </View>

      {layout.layoutReady && renderPieces(layout.pieces)}
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
