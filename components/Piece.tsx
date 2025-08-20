import {
  PIECE_DROP_DURATION,
  SLOT_INSERT_DURATION,
  WELL_RETURN_DURATION,
} from "@/constants/animations";
import { BOARD_SIZE, PIECE_RADIUS, PIECE_SIZE } from "@/constants/gameElements";
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
  currentWellId?: string;
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
  console.log("slots", slots);
  console.log("wellSpaces", wellSpaces);
  console.log("boardSpaces", boardSpaces);
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

  const allTargets = [...wellSpaceArray, ...slotArray];

  const pieceRef = useRef<View>(null);
  const offset = useSharedValue({
    x: initialPosition.x,
    y: initialPosition.y,
  });

  const translateX = useSharedValue(initialPosition.x);
  const translateY = useSharedValue(initialPosition.y);
  const [placed, setPlaced] = React.useState(false);
  const isPlaced = useSharedValue(false);
  const isHeld = useSharedValue(false);
  const boardPieceLocationsSV = useSharedValue(boardPieceLocations);

  useEffect(() => {
    boardPieceLocationsSV.value = boardPieceLocations;
  }, [boardPieceLocations]);

  const setBoardPieceLocationsUI = (destSpaceId: string) => {
    setBoardPieceLocations((prev) => ({
      ...prev,
      [destSpaceId]: id,
    }));
  };

  const setWellPieceLocationsUI = (wellSpaceId: string) => {
    setWellPieceLocations((prev) => ({
      ...prev,
      [wellSpaceId]: team,
    }));
  };

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
    .enabled(!placed)
    .onBegin(() => {
      // LOG WELL PIECE LOCATIONS, BOARD PIECE LOCATIONS
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
    // .onUpdate((event) => {
    //   translateX.value = offset.value.x + event.translationX;
    //   translateY.value = offset.value.y + event.translationY;
    // })
    .onUpdate((event) => {
      translateX.value = event.absoluteX - PIECE_RADIUS;
      translateY.value = event.absoluteY - PIECE_RADIUS;
    })
    .onEnd(() => {
      isHeld.value = false;
      isPlaced.value = true;
      runOnJS(setPlaced)(true);
      offset.value.x = translateX.value;
      offset.value.y = translateY.value;

      const pieceCenter = {
        x: translateX.value + PIECE_RADIUS,
        y: translateY.value + PIECE_RADIUS,
      };

      // FIND THE SPACE IT WAS DROPPED ON
      for (const target of allTargets) {
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
          const isBoardSpace = target.id in boardSpaces;
          const isWellSpace = target.id in wellSpaces;

          // There is no need for the NSEW in the slot id "E-1-0"
          // Remove it and N = 8-X, S = 0-X, E = X-0, W = X-8
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
              withTiming(tx + tWidth / 2 - PIECE_RADIUS, {
                duration: SLOT_INSERT_DURATION,
                easing: Easing.inOut(Easing.quad),
              }),
              withTiming(
                destinationSpaceLayout.pageX +
                  destinationSpaceLayout.width / 2 -
                  PIECE_RADIUS,
                {
                  duration: PIECE_DROP_DURATION,
                  easing: Easing.bounce,
                }
              )
            );

            translateY.value = withSequence(
              withTiming(ty + tHeight / 2 - PIECE_RADIUS, {
                duration: SLOT_INSERT_DURATION,
                easing: Easing.inOut(Easing.quad),
              }),
              withTiming(
                destinationSpaceLayout.pageY +
                  destinationSpaceLayout.width / 2 -
                  PIECE_RADIUS,
                { duration: PIECE_DROP_DURATION, easing: Easing.bounce }
              )
            );

            runOnJS(setBoardPieceLocationsUI)(destinationSpaceId);
          } else if (isBoardSpace) {
            console.log("is boardSpace");
            // Check N,S,E,W if there is no piece by the time you reach a slot
            // in one of those directions, break
            // Animate the piece to the slot in the slot in that direction.
            // It runs if slot
          } else if (isWellSpace) {
            runOnJS(setWellPieceLocationsUI)(target.id);
            translateX.value = withTiming(tx + tWidth / 2 - PIECE_RADIUS, {
              duration: WELL_RETURN_DURATION,
              easing: Easing.inOut(Easing.quad),
            });
            translateY.value = withTiming(tx + tHeight / 2 - PIECE_RADIUS, {
              duration: WELL_RETURN_DURATION,
              easing: Easing.inOut(Easing.quad),
            });
          } else {
            console.log("Dropped outside any valid space");
          }
        } // end if spaceFound
      } // end for allTargets
    }); // end onEnd

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
  //           x: layout.pageX + layout.width / 2 - PIECE_RADIUS,
  //           y: layout.pageY + layout.height / 2 - PIECE_RADIUS,
  //         },
  //         useNativeDriver: false,
  //         speed: 20,
  //         bounciness: 10,
  //       }).start();

  //       currentBoardIdRef.current = boardId;
  //     }
  //   }, [boardPieceLocations, boardSpaces]);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
      // backgroundColor: isHeld.value ? "red" : team,
    };
  });

  const baseStyle: ViewStyle = {
    height: PIECE_SIZE,
    width: PIECE_SIZE,
    borderRadius: PIECE_RADIUS,
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
    shadowRadius: PIECE_RADIUS,
    elevation: 8,
  };

  return (
    <GestureDetector gesture={pan}>
      <Animated.View ref={pieceRef} style={[baseStyle, animatedStyles]} />
    </GestureDetector>
  );
};

export default Piece;
