import BackButton from "@/components/BackButton";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const HowToPlay = () => {
  const [isTwoPlayer, setIsTwoPlayer] = useState(true);

  const handleSelectGameType = (isTwoPlayer: boolean) => {
    setIsTwoPlayer(isTwoPlayer);
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <BackButton />

        <Text className="text-black font-bold text-5xl text-center mb-8">
          How to Play
        </Text>

        <View className="flex-row justify-evenly mb-8">
          <Pressable onPress={() => handleSelectGameType(true)}>
            <Text
              className={`text-2xl font-bold ${
                isTwoPlayer ? "text-black" : "text-gray-500"
              }`}
            >
              Two Player
            </Text>
          </Pressable>

          <Pressable onPress={() => handleSelectGameType(false)}>
            <Text
              className={`text-2xl font-bold ${
                !isTwoPlayer ? "text-black" : "text-gray-500"
              }`}
            >
              Four Player
            </Text>
          </Pressable>
        </View>

        <View className="w-full">
          {isTwoPlayer ? (
            <Text className=" text-lg text-black pl-20 pr-20 ">
              Each player takes a turn dropping a piece into the board.{"\n"}
              Pieces are dropped into any side of the board and fall to the
              opposite edge or to another piece.{"\n"}
              The first player to place four pieces in a row (horizontally,
              vertically, or diagonally) wins the game.{"\n\n"}
              <Text className="font-bold">But here&apos;s the twist...</Text>
              {"\n"}A player may forfeit placing a piece to shift gravity and
              pull all pieces to one side of the board!
            </Text>
          ) : (
            <Text className="text-lg text-black pl-20 pr-20">
              Players are on teams of two. Your partner is the person seated
              across the board from you.{"\n"}
              Each turn, a player drops a piece into their side of the board.{" "}
              {"\n"}
              Pieces fall to the opposite edge or to until they hit another
              piece.{"\n"}
              The first team to place four pieces in a row (horizontally,
              vertically, or diagonally) wins the game.{"\n\n"}
              <Text className="font-bold">But here&apos;s the twist...</Text>
              {"\n"}A player may forgo placing a piece to either pull all pieces
              to their side or rotate the board 90°!
            </Text>
          )}
          <Text className="text-lg font-bold pl-20 pr-20">
            Needs to have all of the moves you can make, along with graphics
            demonstrating them.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default HowToPlay;
