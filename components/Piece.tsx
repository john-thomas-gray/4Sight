import { useGameContext } from "@/context/GameContext";
import React, { useEffect, useRef, useState } from "react";
import { View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

type PieceProps = {
  team?: "black" | "white";
  id?: string;
  initialPosition?: { x: number; y: number };
  currentWellId?: string;
  currentBoardId?: string;
};

const Piece = ({
  team = "white",
  id = "X-0",
  initialPosition = { x: 0, y: 0 },
  currentWellId,
  currentBoardId,
}: PieceProps) => {
  // const pan = useRef(new Animated.ValueXY(initialPosition)).current;
  // const [isDragging, setIsDragging] = useState(false);
  // const held = useSharedValue<boolean>(false);
  // const size = useSharedValue<number>(0);
  const pieceRef = useRef<View>(null);
  const offsetX = useSharedValue(initialPosition.x);
  const offsetY = useSharedValue(initialPosition.y);
  const [isDragging, setIsDragging] = useState(false);

  const {
    wellSpaces,
    slots,
    boardSpaces,
    boardPieceLocations,
    setBoardPieceLocations,
    wellPieceLocations,
    setWellPieceLocations,
  } = useGameContext();

  const wellSpaceArray = Object.entries(wellSpaces[team]).map(
    ([id, layout]) => ({
      id,
      layout,
    })
  );

  const slotArray = Object.entries(slots).map(([id, data]) => ({
    id,
    layout: data.layout,
  }));

  // CONSOLIDATE TO JUST ONE ID AND IT CHECKS WHICH IT IS
  // WITH A PREFIX W OR B
  const allTargets = [...wellSpaceArray, ...slotArray];
  const currentBoardIdRef = useRef<string | null>(currentBoardId ?? null);
  const boardPieceLocationsRef = useRef(boardPieceLocations);
  const currentWellIdRef = useRef<string | null>(currentWellId ?? null);
  const wellPieceLocationsRef = useRef(wellPieceLocations);
  // UPDATE THE STATE OF THE PIECES IN THE WELL
  useEffect(() => {
    wellPieceLocationsRef.current = wellPieceLocations;
  }, [wellPieceLocations]);
  // UPDATE THE STATE OF THE PIECES ON THE BOARD
  useEffect(() => {
    boardPieceLocationsRef.current = boardPieceLocations;
  }, [boardPieceLocations]);

  //  // HANDLES PULLING ANIMATION
  //   useEffect(() => {
  //     const boardId = Object.entries(boardPieceLocations).find(
  //       ([spaceId, pieceId]) => pieceId === id
  //     )?.[0];

  //     if (boardId && boardSpaces[boardId]) {
  //       const layout = boardSpaces[boardId];
  //       // // UNNECESSARY?
  //       Animated.spring(pan, {
  //         toValue: {
  //           x: layout.pageX + layout.width / 2 - 16,
  //           y: layout.pageY + layout.height / 2 - 16,
  //         },
  //         useNativeDriver: false,
  //         speed: 20,
  //         bounciness: 10,
  //       }).start();

  //       currentBoardIdRef.current = boardId;
  //     }
  //   }, [boardPieceLocations, boardSpaces]);

  // SET THE INITIAL LOCATION FOR THE WELL PIECES IN CONTEXT
  const translateX = useSharedValue(initialPosition.x);
  const translateY = useSharedValue(initialPosition.y);

  useEffect(() => {
    translateX.value = initialPosition.x;
    translateY.value = initialPosition.y;
  }, [initialPosition]);

  useEffect(() => {
    if (currentWellId) {
      setWellPieceLocations((prev) => ({
        ...prev,
        [currentWellId]: team,
      }));
    }
  }, []);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  const baseStyle: ViewStyle = {
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: team === "white" ? "white" : "black",
    borderWidth: 2,
    borderColor: "#9CA3AF",
    zIndex: 1000,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 0,
    left: 0,
  };

  const draggingStyle: ViewStyle = {
    height: 48,
    width: 48,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 8,
  };

  return (
    // <GestureDetector gesture={pan}>
    <Animated.View
      ref={pieceRef}
      style={[
        baseStyle,
        animatedStyles,
        // isDragging && draggingStyle
      ]}
    />
    // </GestureDetector>
  );
};

export default Piece;
