import Board from '@/components/Board';
import PieceWell from '@/components/PieceWell';
import React, { useState } from 'react';
import { Dimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const BOARD_MAX_SIZE = width * 0.45;



const TwoPlayer = () => {
  const [spawnedPiece, setSpawnedPiece] = useState<null | { x: number; y: number }>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  return (
    <SafeAreaView
      className="flex-1 bg-green-700"
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'center',  // center all horizontally
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 30,
          gap: 20, // add some spacing between children (RN 0.71+)
        }}
      >
        <PieceWell team="white" />
        <View
          style={{
            width: BOARD_MAX_SIZE,
            aspectRatio: 1,
          }}
        >
          <Board className="h-full"/>
        </View>
        <PieceWell team="black" />
      </View>
    </SafeAreaView>)
    };

    export default TwoPlayer;
