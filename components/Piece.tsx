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
  const {
    wells,
    slots,
    spaces,
    boardPieceLocations,
    setBoardPieceLocations,
    wellPieceLocations,
    setWellPieceLocations,
  } = useGameContext();
  // console.log("slots", slots);
  // console.log("spaces", spaces);
  // console.log("wells", wells);
  const wellArray = Object.entries(wells[team]).map(([id, layout]) => ({
    id,
    layout,
  }));

  const slotArray = Object.entries(slots).map(([id, data]) => ({
    id,
    layout: data.layout,
  }));

  const allTargets = [...wellArray, ...slotArray];

  const pieceRef = useRef<View>(null);
  const offset = useSharedValue({
    x: initialPosition.x,
    y: initialPosition.y,
  });

  const translateX = useSharedValue(initialPosition.x);
  const translateY = useSharedValue(initialPosition.y);
  const [onBoard, setOnBoard] = React.useState(false);
  const onBoardSV = useSharedValue(false);
  const isHeld = useSharedValue(false);
  const boardPieceLocationsSV = useSharedValue(boardPieceLocations);

  useEffect(() => {
    boardPieceLocationsSV.value = boardPieceLocations;
  }, [boardPieceLocations]);

  const setBoardPieceLocationsSV = (destSpaceId: string) => {
    setBoardPieceLocations((prev) => ({
      ...prev,
      [destSpaceId]: id,
    }));
  };

  const setWellPieceLocationsSV = (wellId: string) => {
    setWellPieceLocations((prev) => ({
      ...prev,
      [wellId]: team,
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
    .enabled(!onBoard)
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

        console.log("Piece center:", pieceCenter);
        console.log("Target bounds:", {
          id: target.id,
          x1: tx,
          x2: tx + tWidth,
          y1: ty,
          y2: ty + tHeight,
        });

        if (spaceFound) {
          const isSlot = target.id in slots;
          const isSpace = target.id in spaces;
          const isWell = target.id in wells[team];

          if (isSpace) {
            console.log(isSpace);
          }

          let [row, col] = target.id.split("-").map(Number) as [number, number];
          let prevRow: number | null = null;
          let prevCol: number | null = null;

          if (isSlot) {
            const slotDirection =
              row === 8 ? "N" : row === 0 ? "S" : col === 0 ? "E" : "W";

            const deltas: Record<string, { dr: number; dc: number }> = {
              N: { dr: -1, dc: 0 },
              S: { dr: 1, dc: 0 },
              E: { dr: 0, dc: 1 },
              W: { dr: 0, dc: -1 },
            };

            row += deltas[slotDirection].dr;
            col += deltas[slotDirection].dc;

            while (true) {
              // extract to higher scope
              const boardId = `${row}-${col}`;
              const boardLayout = spaces[boardId];

              const isOccupied =
                boardPieceLocationsSV.value[boardId] !== undefined;

              if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE)
                break;

              if (!boardLayout) break;

              if (isOccupied) break;

              prevRow = row;
              prevCol = col;

              row += deltas[slotDirection].dr;
              col += deltas[slotDirection].dc;
            }

            if (prevRow === null || prevCol === null) {
              console.warn("No free board space near slot:", target.id);
              return;
            }

            const destinationSpaceId = `${prevRow}-${prevCol}`;
            const destinationSpaceLayout = spaces[destinationSpaceId];

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

            runOnJS(setBoardPieceLocationsSV)(destinationSpaceId);
          } else if (isSpace) {
            console.log("is space");
            // Check N,S,E,W if there is no piece by the time you reach a slot
            // in one of those directions, break
            // Animate the piece to the slot in the slot in that direction.
            // It runs if slot
          } else if (isWell) {
            console.log("is well");
            runOnJS(setWellPieceLocationsSV)(target.id);
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
          if (
            isSlot
            // || isSpace
          ) {
            onBoardSV.value = true;
            runOnJS(setOnBoard)(true);
          }
        } // end if spaceFound
      } // end for allTargets
    }); // end onEnd

  //  // HANDLES PULLING ANIMATION
  //   useEffect(() => {
  //     const boardId = Object.entries(boardPieceLocations).find(
  //       ([spaceId, pieceId]) => pieceId === id
  //     )?.[0];

  //     if (boardId && spaces[boardId]) {
  //       const layout = spaces[boardId];
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
  //   }, [boardPieceLocations, spaces]);

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
