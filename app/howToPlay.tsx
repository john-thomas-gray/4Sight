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
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 32,
        }}
      >
        <BackButton />

        <Text className="text-black font-bold text-4xl text-center mb-6">
          How to Play
        </Text>

        <View className="flex-row justify-center gap-8 mb-6">
          <Pressable
            className="px-4 py-2 rounded-lg border border-gray-300"
            onPress={() => handleSelectGameType(true)}
          >
            <Text
              className={`text-xl font-bold ${
                isTwoPlayer ? "text-black" : "text-gray-500"
              }`}
            >
              Two Player
            </Text>
          </Pressable>

          <Pressable
            className="px-4 py-2 rounded-lg border border-gray-300"
            onPress={() => handleSelectGameType(false)}
          >
            <Text
              className={`text-xl font-bold ${
                !isTwoPlayer ? "text-black" : "text-gray-500"
              }`}
            >
              Four Player
            </Text>
          </Pressable>
        </View>

        <View className="w-full">
          {isTwoPlayer ? (
            <Text className="text-base leading-6 text-black">
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
            <Text className="text-base leading-6 text-black">
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
          <Text className="text-base font-bold mt-6">
            Needs to have all of the moves you can make, along with graphics
            demonstrating them.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default HowToPlay;
