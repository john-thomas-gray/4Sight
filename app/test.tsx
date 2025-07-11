import Board from "@/components/Board";
import Piece from "@/components/Piece";
import PieceWell from "@/components/PieceWell";
import { useGameContext } from "@/context/GameContext";
import React, { useEffect, useState } from "react";
import { View } from "react-native";

const Test = () => {
  const { wellSpaces } = useGameContext();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (Object.keys(wellSpaces.white).length > 0) {
      setReady(true);
    }
  }, [wellSpaces.white]);

  const whiteWellSpaces = Object.entries(wellSpaces.white);
  const blackWellSpaces = Object.entries(wellSpaces.black);

  const allEntries = [...whiteWellSpaces, ...blackWellSpaces];

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
        wellSpaces={allEntries.map(([id, layout]) => ({ id, layout }))}
      />
    ));

  return (
    <View className="flex-1 flex-row items-center justify-center mt-90 bg-[#065f46]">
      <View className="flex-row justify-between p-16">
        <PieceWell team="white" />
        <Board className="mx-10" />
        <PieceWell team="black" />
      </View>
      {renderPieces(whiteWellSpaces, "white")}
      {renderPieces(blackWellSpaces, "black")}
    </View>
  );
};

export default Test;
