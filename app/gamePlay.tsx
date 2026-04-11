import BoardGridView from "@/components/BoardGridView";
import GravityGestureLayer from "@/components/GravityGestureLayer";
import PieceView from "@/components/PieceView";
import TeamWellGrid from "@/components/TeamWellGrid";
import WinOverlay from "@/components/WinOverlay";
import { PIECE_RADIUS } from "@/constants/gameElements";
import { PieceStatus, useGameSession } from "@/context/GameSessionContext";
import { useLayout } from "@/context/LayoutContext";
import { useSettings } from "@/context/SettingsContext";
import { Team } from "@/engine";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";

const GamePlay = () => {
  const layout = useLayout();
  const { gameState, pieceStatusMap, wellPieceLocations, pieceAnims } =
    useGameSession();
  const { theme } = useSettings();
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const positionsInitialized = useRef(false);

  // Position pieces at their locations once layout is ready.
  // Handles both fresh games (pieces in wells) and continued games
  // (some pieces on the board, some in wells).
  useEffect(() => {
    if (!layout.layoutReady || positionsInitialized.current) return;

    // Position pieces in wells
    Object.entries(wellPieceLocations).forEach(([wellId, pieceId]) => {
      const wellLayout =
        layout.wells[Team.One]?.[wellId] ?? layout.wells[Team.Two]?.[wellId];
      const anim = pieceAnims[pieceId];
      if (wellLayout && anim) {
        anim.translateX.value =
          wellLayout.pageX + wellLayout.width / 2 - PIECE_RADIUS;
        anim.translateY.value =
          wellLayout.pageY + wellLayout.height / 2 - PIECE_RADIUS;
      }
    });

    // Position pieces on the board (from continued game)
    Object.entries(gameState.board).forEach(([spaceId, pieceId]) => {
      const spaceLayout = layout.spaces[spaceId];
      const anim = pieceAnims[pieceId];
      if (spaceLayout && anim) {
        anim.translateX.value =
          spaceLayout.pageX + spaceLayout.width / 2 - PIECE_RADIUS;
        anim.translateY.value =
          spaceLayout.pageY + spaceLayout.height / 2 - PIECE_RADIUS;
        anim.scaleX.value = 1;
        anim.scaleY.value = 1;
      }
    });

    positionsInitialized.current = true;
  }, [
    layout.layoutReady,
    layout.wells,
    layout.spaces,
    wellPieceLocations,
    gameState.board,
    pieceAnims,
  ]);

  const piecesReady =
    layout.layoutReady && Object.keys(gameState.pieces).length > 0;

  const piecesToRender = useMemo(
    () => Object.entries(gameState.pieces),
    [gameState.pieces]
  );

  useEffect(() => {
    if (gameState.status !== "finished" || !gameState.winner) {
      setShowWinOverlay(false);
      return;
    }
    const winnerCount = Object.values(pieceStatusMap).filter(
      (s) => s === PieceStatus.winner
    ).length;
    if (winnerCount === 0) return;
    const timer = setTimeout(() => setShowWinOverlay(true), 1200);
    return () => clearTimeout(timer);
  }, [gameState.status, gameState.winner, pieceStatusMap]);

  return (
    <View
      className="flex-1 flex-col items-center justify-center"
      style={{ backgroundColor: theme.colorTheme.FELT_TOP }}
    >
      <View className="flex-col items-center justify-center">
        <TeamWellGrid team={Team.Two} />
        <GravityGestureLayer className="mt-7 mb-7">
          <BoardGridView />
        </GravityGestureLayer>
        <TeamWellGrid team={Team.One} />
      </View>

      {piecesReady &&
        positionsInitialized.current &&
        piecesToRender.map(([pid, piece]) => (
          <PieceView key={pid} id={pid} team={piece.team} />
        ))}

      <WinOverlay
        visible={showWinOverlay && gameState.winner !== null}
        winner={gameState.winner === Team.One ? "teamOne" : "teamTwo"}
        onClose={() => setShowWinOverlay(false)}
      />
    </View>
  );
};

export default GamePlay;
