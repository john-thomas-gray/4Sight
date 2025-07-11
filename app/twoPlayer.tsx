import Board from "@/components/Board";
import Piece from "@/components/Piece";
import PieceWell from "@/components/PieceWell";
import { useGameContext } from "@/context/GameContext";
import React, { useEffect, useState } from "react";
import { View } from "react-native";

const TwoPlayer = () => {
  const { wellSpaces, slots } = useGameContext();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (Object.keys(wellSpaces.white).length > 0) {
      setReady(true);
    }
  }, [wellSpaces.white]);

  const whiteWellSpaces = Object.entries(wellSpaces.white);
  const blackWellSpaces = Object.entries(wellSpaces.black);

  const allEntries = [...whiteWellSpaces, ...blackWellSpaces];
  const slotsArray = Object.entries(slots).map(([id, slot]) => ({
    id,
    layout: slot.layout,
  }));

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
        team={team}
        currentWellId={id}
        initialPosition={{
          x: layout.pageX + layout.width / 2 - 16,
          y: layout.pageY + layout.height / 2 - 16,
        }}
        slots={slotsArray}
        wellSpaces={allEntries.map(([id, layout]) => ({ id, layout }))}
      />
    ));

  return (
    <View className="flex-1 flex-row items-center justify-center mt-90 bg-[#065f46]">
      <View className="flex-row justify-between">
        <PieceWell team="white" />
        <Board className="mx-10" />
        <PieceWell team="black" />
      </View>
      {ready && renderPieces(whiteWellSpaces, "white")}
      {ready && renderPieces(blackWellSpaces, "black")}
    </View>
  );
};

export default TwoPlayer;
