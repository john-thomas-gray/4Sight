import { useGameContext } from "@/context/GameContext";
import React, { useEffect, useRef } from "react";
import { View, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type PieceProps = {
  team: "black" | "white";
  id: string;
  initialPosition: { x: number; y: number };
  currentWellId?: string | undefined;
  currentBoardId?: string;
};

const Piece = ({
  team = "white",
  id = "X-0",
  initialPosition,
  currentWellId,
  currentBoardId,
}: PieceProps) => {
  // const pan = useRef(new Animated.ValueXY(initialPosition)).current;
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

  const pieceRef = useRef<View>(null);
  const offset = useSharedValue({
    x: initialPosition.x,
    y: initialPosition.y,
  });

  const translateX = useSharedValue(initialPosition.x);
  const translateY = useSharedValue(initialPosition.y);
  const isHeld = useSharedValue(false);
  const boardPieceLocationsSV = useSharedValue(boardPieceLocations);
  const currentWellIdSV = useSharedValue<string | null>(currentWellId ?? null);

  useEffect(() => {
    boardPieceLocationsSV.value = boardPieceLocations;
  }, [boardPieceLocations]);

  useEffect(() => {
    currentWellIdSV.value = currentWellId ?? null;
  }, [currentWellId]);

  const deletePieceFromWell = (wellId: string | null) => {
    if (!wellId) return;
    setWellPieceLocations((prev) => {
      const updated = { ...prev };
      delete updated[wellId];
      return updated;
    });
  };

  const BOARD_SIZE = 9;
  const PIECE_SIZE = 32;

  //  // HANDLES PULLING ANIMATION
  //   useEffect(() => {
  //     const boardId = Object.entries(boardPieceLocations).find(
  //       ([spaceId, pieceId]) => pieceId === id
  //     )?.[0];

  //     if (boardId && boardSpaces[boardId]) {
  //       const layout = boardSpaces[boardId];
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

  const pan = Gesture.Pan()
    .onBegin(() => {
      isHeld.value = true;
      runOnJS(deletePieceFromWell)(currentWellIdSV.value);

      // Reset the shared value
      currentWellIdSV.value = null;
    })
    .onUpdate((event) => {
      translateX.value = offset.value.x + event.translationX;
      translateY.value = offset.value.y + event.translationY;
    })
    .onEnd(() => {
      isHeld.value = false;
      offset.value.x = translateX.value;
      offset.value.y = translateY.value;

      const pieceCenter = {
        x: translateX.value + PIECE_SIZE / 2,
        y: translateY.value + PIECE_SIZE / 2,
      };

      // FIND THE SPACE IT WAS DROPPED ON
      for (const target of allTargets) {
        if (!target.layout) continue;
        const {
          pageX: tx,
          pageY: ty,
          width: tWidth,
          height: tHeight,
        } = target.layout;

        const spaceFound =
          pieceCenter.x >= tx &&
          pieceCenter.x <= tx + tWidth &&
          pieceCenter.y >= ty &&
          pieceCenter.y <= ty + tHeight;

        if (spaceFound) {
          const isSlot = target.id in slots;
          const isWellSpace =
            team in wellSpaces && target.id in wellSpaces[team];

          if (isSlot) {
            const data = target.id.split("-");
            if (data.length !== 3) {
              console.warn("Malformed slot ID:", target.id);
              continue;
            }

            const [orientation, rowStr, colStr] = data;
            let row = parseInt(rowStr, 10);
            let col = parseInt(colStr, 10);

            switch (orientation) {
              case "N":
                row -= 1;
                break;
              case "S":
                row += 1;
                break;
              case "E":
                col += 1;
                break;
              case "W":
                col -= 1;
                break;
            }

            let prevRow: number | null = null;
            let prevCol: number | null = null;

            while (true) {
              if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE)
                break;

              const boardId = `${row}-${col}`;
              const boardLayout = boardSpaces[boardId];

              if (!boardLayout) break;

              const isOccupied =
                boardPieceLocationsSV.value[boardId] !== undefined;

              if (isOccupied) break;

              prevRow = row;
              prevCol = col;

              switch (orientation) {
                case "N":
                  row -= 1;
                  break;
                case "S":
                  row += 1;
                  break;
                case "E":
                  col += 1;
                  break;
                case "W":
                  col -= 1;
                  break;
              }
            }

            if (prevRow === null || prevCol === null) {
              console.warn("No free board space near slot:", target.id);
              return;
            }

            const destinationSpaceId = `${prevRow}-${prevCol}`;
            const destinationSpaceLayout = boardSpaces[destinationSpaceId];

            if (!destinationSpaceLayout) {
              console.warn(
                "No layout for final board space",
                destinationSpaceId
              );
              return;
            }

            // Animate to slot
            translateX.value = withSequence(
              withTiming(tx + tWidth / 2 - 16, {
                duration: 100,
                easing: Easing.inOut(Easing.quad),
              }),
              withTiming(
                destinationSpaceLayout.pageX +
                  destinationSpaceLayout.width / 2 -
                  16,
                {
                  duration: 500,
                  easing: Easing.bounce,
                }
              )
            );

            translateY.value = withSequence(
              withTiming(ty + tHeight / 2 - 16, {
                duration: 100,
                easing: Easing.inOut(Easing.quad),
              }),
              withTiming(
                destinationSpaceLayout.pageY +
                  destinationSpaceLayout.width / 2 -
                  16,
                { duration: 500, easing: Easing.bounce }
              )
            );

            // UPDATE THE PIECE'S LOCATION ON THE BOARD
            setBoardPieceLocations((prev) => ({
              ...prev,
              [destinationSpaceId]: id,
            }));
          }
          // else if (isWellSpace) {
          //   setWellPieceLocations((prev) => ({
          //     ...prev,
          //     [target.id]: team,
          //   }));
          //   currentWellIdSV.value = target.id;

          //   translateX.value = withTiming(tx + tWidth / 2 - 16);
          //   translateY.value = withTiming(ty + tHeight / 2 - 16);
          // } else {
          //   console.log("❌ Dropped outside any valid space");
          // }
        } // end if spaceFound
      } // end for allTargets
    }); // end onEnd
  // STYLES
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
    height: PIECE_SIZE,
    width: PIECE_SIZE,
    borderRadius: PIECE_SIZE / 2,
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
      <Animated.View ref={pieceRef} style={[baseStyle, animatedStyles]} />
    </GestureDetector>
  );
};

export default Piece;
