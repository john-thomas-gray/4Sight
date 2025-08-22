import {
  PIECE_DROP_DURATION,
  SLOT_INSERT_DURATION,
  WELL_RETURN_DURATION,
} from "@/constants/animations";
import { BOARD_SIZE, PIECE_RADIUS, PIECE_SIZE } from "@/constants/gameElements";
import { useGameContext } from "@/context/GameContext";
import { CellProps } from "@/types/board";
import React, { useEffect } from "react";
import { ViewStyle } from "react-native";
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

  const wellArray = Object.entries(wells[team]).map(([id, layout]) => ({
    id,
    layout,
    type: "well" as const,
    team,
  }));

  const slotArray = Object.entries(slots).map(([id, data]) => ({
    id,
    layout: data.layout,
    type: "slot" as const,
  }));

  const spaceArray = Object.entries(spaces).map(([id, layout]) => ({
    id,
    layout,
    type: "space" as const,
  }));

  const allCells: CellProps[] = [...wellArray, ...slotArray, ...spaceArray];

  const offset = useSharedValue({
    x: initialPosition.x,
    y: initialPosition.y,
  });

  const getCurrentWellData = (id: string) => {
    return wellArray.find((well) => well.id === id) || null;
  };

  const translateX = useSharedValue(initialPosition.x);
  const translateY = useSharedValue(initialPosition.y);
  const currentWellDataSV = useSharedValue<CellProps | null>(
    currentWellId ? getCurrentWellData(currentWellId) : null
  );
  const [onBoard, setOnBoard] = React.useState(false);
  const onBoardSV = useSharedValue(false);
  const isHeld = useSharedValue(false);
  const boardPieceLocationsSV = useSharedValue(boardPieceLocations);

  useEffect(() => {
    boardPieceLocationsSV.value = boardPieceLocations;
  }, [boardPieceLocations]);

  useEffect(() => {
    if (currentWellId) {
      currentWellDataSV.value = getCurrentWellData(currentWellId);
    } else {
      currentWellDataSV.value = null;
    }
  }, [currentWellId]);

  const setBoardPieceLocationsSV = (finalSpaceId: string) => {
    setBoardPieceLocations((prev) => ({
      ...prev,
      [finalSpaceId]: id,
    }));
  };

  const setWellPieceLocationsSV = (wellId: string) => {
    setWellPieceLocations((prev) => ({
      ...prev,
      [wellId]: id,
    }));
    console.log(wellPieceLocations);
  };

  const deleteWellPieceLocationSV = () => {
    if (currentWellId) {
      setWellPieceLocations((prev) => {
        const updated = { ...prev };
        delete updated[currentWellId as string];
        return updated;
      });
    }
  };

  useEffect(() => {
    if (currentWellId) {
      setWellPieceLocations((prev) => ({
        ...prev,
        [currentWellId]: id,
      }));
    }
  }, []);

  const pan = Gesture.Pan()
    .enabled(!onBoard)
    .onStart(() => {
      isHeld.value = true;
      runOnJS(deleteWellPieceLocationSV)();
    })
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

      let noCellFound = true;

      for (const selectedCell of allCells) {
        if (!selectedCell.layout) continue;

        const {
          pageX: scX,
          pageY: scY,
          width: scWidth,
          height: scHeight,
        } = selectedCell.layout;

        const cellFound =
          pieceCenter.x >= scX &&
          pieceCenter.x <= scX + scWidth &&
          pieceCenter.y >= scY &&
          pieceCenter.y <= scY + scHeight;

        if (!cellFound) continue;

        noCellFound = false;

        const isCorner = false;
        const isSlot = selectedCell.id in slots;
        const isSpace = selectedCell.id in spaces;
        const isWell = selectedCell.id in wells[team];

        let [nextRow, nextCol] = selectedCell.id.split("-").map(Number) as [
          number,
          number
        ];
        let prevRow: number | null = null;
        let prevCol: number | null = null;
        if (isCorner) {
          // Send the space back to the well.
        } else if (isSlot) {
          const slotDirection =
            nextRow === 8
              ? "N"
              : nextRow === 0
              ? "S"
              : nextCol === 0
              ? "E"
              : "W";

          const deltas: Record<string, { dr: number; dc: number }> = {
            N: { dr: -1, dc: 0 },
            S: { dr: 1, dc: 0 },
            E: { dr: 0, dc: 1 },
            W: { dr: 0, dc: -1 },
          };

          nextRow += deltas[slotDirection].dr;
          nextCol += deltas[slotDirection].dc;

          while (true) {
            // extract to higher scope?
            const nextSpaceId = `${nextRow}-${nextCol}`;
            const nextSpace = spaces[nextSpaceId];

            const isOccupied =
              boardPieceLocationsSV.value[nextSpaceId] !== undefined;

            if (
              nextRow < 0 ||
              nextRow >= BOARD_SIZE ||
              nextCol < 0 ||
              nextCol >= BOARD_SIZE
            )
              break;

            if (!nextSpace) break;

            if (isOccupied) break;

            prevRow = nextRow;
            prevCol = nextCol;

            nextRow += deltas[slotDirection].dr;
            nextCol += deltas[slotDirection].dc;
          }

          if (prevRow === null || prevCol === null) {
            console.warn("No free board space near slot:", selectedCell.id);
            if (
              currentWellDataSV.value?.layout &&
              currentWellDataSV.value?.id
            ) {
              runOnJS(setWellPieceLocationsSV)(currentWellDataSV.value.id);

              translateX.value = withTiming(
                currentWellDataSV.value.layout.pageX +
                  currentWellDataSV.value.layout.width / 2 -
                  PIECE_RADIUS,
                {
                  duration: WELL_RETURN_DURATION,
                  easing: Easing.inOut(Easing.quad),
                }
              );
              translateY.value = withTiming(
                currentWellDataSV.value.layout.pageY +
                  currentWellDataSV.value.layout.height / 2 -
                  PIECE_RADIUS,
                {
                  duration: WELL_RETURN_DURATION,
                  easing: Easing.inOut(Easing.quad),
                }
              );
            }
            return;
          }

          const finalSpaceId = `${prevRow}-${prevCol}`;
          const finalSpaceLayout = spaces[finalSpaceId];

          if (!finalSpaceLayout) {
            console.warn("No layout for final board space", finalSpaceId);
            return;
          }

          // Animate to slot
          translateX.value = withSequence(
            withTiming(scX + scWidth / 2 - PIECE_RADIUS, {
              duration: SLOT_INSERT_DURATION,
              easing: Easing.inOut(Easing.quad),
            }),
            withTiming(
              finalSpaceLayout.pageX +
                finalSpaceLayout.width / 2 -
                PIECE_RADIUS,
              {
                duration: PIECE_DROP_DURATION,
                easing: Easing.bounce,
              }
            )
          );

          translateY.value = withSequence(
            withTiming(scY + scHeight / 2 - PIECE_RADIUS, {
              duration: SLOT_INSERT_DURATION,
              easing: Easing.inOut(Easing.quad),
            }),
            withTiming(
              finalSpaceLayout.pageY +
                finalSpaceLayout.width / 2 -
                PIECE_RADIUS,
              { duration: PIECE_DROP_DURATION, easing: Easing.bounce }
            )
          );

          runOnJS(setBoardPieceLocationsSV)(finalSpaceId);
        } else if (isSpace) {
          console.log("is space");
          console.log("That space is blocked!");
          if (currentWellDataSV.value?.layout && currentWellDataSV.value?.id) {
            runOnJS(setWellPieceLocationsSV)(currentWellDataSV.value.id);

            translateX.value = withTiming(
              currentWellDataSV.value.layout.pageX +
                currentWellDataSV.value.layout.width / 2 -
                PIECE_RADIUS,
              {
                duration: WELL_RETURN_DURATION,
                easing: Easing.inOut(Easing.quad),
              }
            );
            translateY.value = withTiming(
              currentWellDataSV.value.layout.pageY +
                currentWellDataSV.value.layout.height / 2 -
                PIECE_RADIUS,
              {
                duration: WELL_RETURN_DURATION,
                easing: Easing.inOut(Easing.quad),
              }
            );
          }

          // Check N,S,E,W if there is no piece by the time you reach a slot
          // in one of those directions, break
          // Animate the piece to the slot in the slot in that direction.
          // It runs if slot
        } else if (isWell) {
          console.log("is well");
          runOnJS(setWellPieceLocationsSV)(selectedCell.id);
          translateX.value = withTiming(scX + scWidth / 2 - PIECE_RADIUS, {
            duration: WELL_RETURN_DURATION,
            easing: Easing.inOut(Easing.quad),
          });
          translateY.value = withTiming(scY + scHeight / 2 - PIECE_RADIUS, {
            duration: WELL_RETURN_DURATION,
            easing: Easing.inOut(Easing.quad),
          });
        }
        if (
          isSlot
          // || isSpace (also need to check if it is aviable space)
        ) {
          onBoardSV.value = true;
          runOnJS(setOnBoard)(true);
        }
      }
      if (noCellFound) {
        console.log("Dropped outside any valid space");
        if (currentWellDataSV.value?.layout && currentWellDataSV.value?.id) {
          runOnJS(setWellPieceLocationsSV)(currentWellDataSV.value.id);

          translateX.value = withTiming(
            currentWellDataSV.value.layout.pageX +
              currentWellDataSV.value.layout.width / 2 -
              PIECE_RADIUS,
            {
              duration: WELL_RETURN_DURATION,
              easing: Easing.inOut(Easing.quad),
            }
          );
          translateY.value = withTiming(
            currentWellDataSV.value.layout.pageY +
              currentWellDataSV.value.layout.height / 2 -
              PIECE_RADIUS,
            {
              duration: WELL_RETURN_DURATION,
              easing: Easing.inOut(Easing.quad),
            }
          );
        }
      }
    }); // end onEnd

  //  // HANDLES PULLING ANIMATION
  //   useEffect(() => {
  //     const nextSpaceId = Object.entries(boardPieceLocations).find(
  //       ([spaceId, pieceId]) => pieceId === id
  //     )?.[0];

  //     if (nextSpaceId && spaces[nextSpaceId]) {
  //       const layout = spaces[nextSpaceId];
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

  //       currentBoardIdRef.current = nextSpaceId;
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
      <Animated.View style={[baseStyle, animatedStyles]} />
    </GestureDetector>
  );
};

export default Piece;
