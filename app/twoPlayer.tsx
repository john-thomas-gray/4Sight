import Board from "@/components/Board";
import Piece from "@/components/Piece";
import PieceWell from "@/components/PieceWell";
import { useGameContext } from "@/context/GameContext";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const TwoPlayer = () => {
  const { wellSpaces, layoutReady } = useGameContext();

  const whiteWellSpaces = Object.entries(wellSpaces.white);
  const blackWellSpaces = Object.entries(wellSpaces.black);

  const renderPieces = (
    entries: [
      string,
      { pageX: number; pageY: number; width: number; height: number }
    ][],
    team: "white" | "black"
  ) =>
    entries.map(([id, layout]) => (
      <Piece
        key={id}
        id={`${id.toString()}-${team[0]}`}
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
        <PieceWell team="white" />
        <Board className="mx-10" />
        <PieceWell team="black" />
      </View>
      {layoutReady && renderPieces(whiteWellSpaces, "white")}
      {layoutReady && renderPieces(blackWellSpaces, "black")}

      {!layoutReady && (
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
