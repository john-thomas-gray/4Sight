import Board from "@/components/Board";
import LoadingScreen from "@/components/LoadingScreen";
import Piece from "@/components/Piece";
import TeamWellGrid from "@/components/TeamWellGrid";
import { useGameContext } from "@/context/GameContext";
import { PieceProps, Team } from "@/types/board";
import React, { useEffect, useMemo, useRef } from "react";
import { View } from "react-native";

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
    team: Team
  ): Record<string, PieceProps> =>
    Object.fromEntries(
      entries.map(([wellId, l], idx) => {
        const id = `${idx}`;
        return [
          id,
          {
            id,
            team,
            currentWellId: wellId,
            initialPosition: {
              x: l.pageX + l.width / 2 - 16,
              y: l.pageY + l.height / 2 - 16,
            },
          } as PieceProps,
        ];
      })
    );

  useEffect(() => {
    if (!layout.layoutReady || initialized.current) return;

    const built: Record<string, PieceProps> = {
      ...toPieces(teamOneWells, Team.TeamOne),
      ...toPieces(teamTwoWells, Team.TeamTwo),
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

export default GamePlay;
