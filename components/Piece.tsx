import { useGameContext } from "@/context/GameContext";
import React, { useEffect, useRef } from "react";
import { View, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

type PieceProps = {
  team?: "black" | "white";
  id?: string;
  initialOffset?: { x: number; y: number };
  currentWellId?: string;
  currentBoardId?: string;
};

const Piece = ({
  team = "white",
  id = "X-0",
  initialOffset = { x: 0, y: 0 },
  currentWellId,
  currentBoardId,
}: PieceProps) => {
  // const pan = useRef(new Animated.ValueXY(initialOffset)).current;
  // const [isDragging, setIsDragging] = useState(false);
  // const held = useSharedValue<boolean>(false);
  // const size = useSharedValue<number>(0);

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

  const pieceRef = useRef<View>(null);
  const offset = useSharedValue({
    x: initialOffset.x,
    y: initialOffset.y,
  });
  let pieceCenter = { x: 0, y: 0 };
  pieceRef.current?.measure((x, y, width, height, pageX, pageY) => {
    pieceCenter = {
      x: pageX + width / 2,
      y: pageY + height / 2,
    };
  });

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isHeld = useSharedValue(false);
  console.log(wellSpaces);

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

  // SET THE WELL PIECE LOCATIONS

  useEffect(() => {
    if (currentWellId) {
      setWellPieceLocations((prev) => ({
        ...prev,
        [currentWellId]: team,
      }));
    }
  }, []);

  const pan = Gesture.Pan()
    .onBegin(() => {
      isHeld.value = true;
      // DELETE THE CURRENT PIECE'S ID FROM ITS WELL
      // if (currentWellIdRef.current) {
      //   setWellPieceLocations((prev) => {
      //     const updated = { ...prev };
      //     delete updated[currentWellIdRef.current as string];
      //     return updated;
      //   });
      //   currentWellIdRef.current = null;
      // }
    })
    .onUpdate((event) => {
      translateX.value = offset.value.x + event.translationX;
      translateY.value = offset.value.y + event.translationY;
    })
    .onEnd((event) => {
      // 👈 equivalent to onPanResponderRelease
      isHeld.value = false;
      offset.value.x = translateX.value;
      offset.value.y = translateY.value;
    });

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
      backgroundColor: isHeld.value ? "red" : team,
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

  const isHeldStyle: ViewStyle = {
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
    <GestureDetector gesture={pan}>
      <Animated.View
        ref={pieceRef}
        style={[
          baseStyle,
          animatedStyles,
          // isDragging && draggingStyle
        ]}
      />
    </GestureDetector>
  );
};

export default Piece;
