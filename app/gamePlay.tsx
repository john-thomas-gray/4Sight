import BackButton from "@/components/BackButton";
import BoardGridView from "@/components/BoardGridView";
import GravityGestureLayer from "@/components/GravityGestureLayer";
import PieceView from "@/components/PieceView";
import TeamWellGrid from "@/components/TeamWellGrid";
import WinOverlay from "@/components/WinOverlay";
import { PIECE_RADIUS } from "@/constants/gameElements";
import { PieceStatus, useGameSession } from "@/context/GameSessionContext";
import { useLayout } from "@/context/LayoutContext";
import { useSettings } from "@/context/SettingsContext";
import { useUi } from "@/context/UiContext";
import { Team } from "@/engine";
import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";

const GamePlay = () => {
  const layout = useLayout();
  const { gameState, pieceStatusMap, wellPieceLocations, pieceAnims } =
    useGameSession();
  const { hoverPreview, isPreviewingGravity, gravityPreviewBoard } = useUi();
  const { theme } = useSettings();
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const colors = theme.colorTheme;
  const textColor = colors.ODD_SPACE_COLOR;

  // Reposition pieces whenever layout updates (wells or spaces register).
  // Runs every time a new cell registers, so pieces land at the right
  // positions even if wells register incrementally.
  useEffect(() => {
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
  }, [
    layout.wells,
    layout.spaces,
    wellPieceLocations,
    gameState.board,
    pieceAnims,
  ]);

  const piecesToRender = useMemo(
    () => Object.entries(gameState.pieces),
    [gameState.pieces],
  );

  useEffect(() => {
    if (gameState.status !== "finished" || !gameState.winner) {
      setShowWinOverlay(false);
      return;
    }
    const winnerCount = Object.values(pieceStatusMap).filter(
      (s) => s === PieceStatus.winner,
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
      <BackButton
        variant="inline"
        textStyle={{ color: textColor }}
        imageStyle={{ tintColor: textColor }}
        style={{
          position: "absolute",
          bottom: 35,
          left: 305,
          borderColor: colors.SLOT_BORDER_COLOR,
          borderWidth: 1,
        }}
      />
      <View className="flex-col items-center justify-center">
        <TeamWellGrid team={Team.Two} />
        <GravityGestureLayer className="mt-7 mb-7">
          <BoardGridView />
        </GravityGestureLayer>
        <TeamWellGrid team={Team.One} />
      </View>

      {piecesToRender.map(([pid, piece]) => (
        <PieceView key={pid} id={pid} team={piece.team} />
      ))}

      {hoverPreview && layout.spaces[hoverPreview.spaceId] ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: PIECE_RADIUS * 2,
            height: PIECE_RADIUS * 2,
            borderRadius: PIECE_RADIUS,
            borderWidth: 2,
            borderColor: colors.SLOT_BORDER_COLOR,
            backgroundColor:
              hoverPreview.team === Team.One
                ? colors.TEAM_ONE_COLOR
                : colors.TEAM_TWO_COLOR,
            opacity: 0.35,
            left:
              layout.spaces[hoverPreview.spaceId].pageX +
              layout.spaces[hoverPreview.spaceId].width / 2 -
              PIECE_RADIUS,
            top:
              layout.spaces[hoverPreview.spaceId].pageY +
              layout.spaces[hoverPreview.spaceId].height / 2 -
              PIECE_RADIUS,
            zIndex: 2500,
          }}
        />
      ) : null}

      {isPreviewingGravity && gravityPreviewBoard
        ? Object.entries(gravityPreviewBoard).map(([spaceId, pieceId]) => {
            const space = layout.spaces[spaceId];
            const piece = gameState.pieces[pieceId];
            if (!space || !piece) return null;
            return (
              <View
                key={`gravity-preview-${pieceId}-${spaceId}`}
                pointerEvents="none"
                style={{
                  position: "absolute",
                  width: PIECE_RADIUS * 2,
                  height: PIECE_RADIUS * 2,
                  borderRadius: PIECE_RADIUS,
                  borderWidth: 2,
                  borderColor: colors.SLOT_BORDER_COLOR,
                  backgroundColor:
                    piece.team === Team.One
                      ? colors.TEAM_ONE_COLOR
                      : colors.TEAM_TWO_COLOR,
                  opacity: 0.3,
                  left: space.pageX + space.width / 2 - PIECE_RADIUS,
                  top: space.pageY + space.height / 2 - PIECE_RADIUS,
                  zIndex: 2400,
                }}
              />
            );
          })
        : null}

      <WinOverlay
        visible={showWinOverlay && gameState.winner !== null}
        winner={gameState.winner === Team.One ? "teamOne" : "teamTwo"}
        onClose={() => setShowWinOverlay(false)}
      />
    </View>
  );
};

export default GamePlay;
