import { Animations, GameElements } from "@/constants";
import { useGameContext } from "@/context/GameContext";
import useBoardPullAnimation from "@/hooks/useBoardPullAnimation";
import { usePieceState } from "@/hooks/usePieceState";
import { Board } from "@/types";
import { HighlightProps, PieceProps, Team } from "@/types/board";
import { GameState } from "@/types/logic";
import { getCellArray } from "@/utils/boardLogic";
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
import Highlight from "./Highlight";

const Piece = ({
  team,
  id = "X-0",
  initialPosition,
  currentWellId,
}: PieceProps) => {
  const { layout, settings, logic } = useGameContext();

  const allCells = getCellArray({ layout, result: "all", team });

  const offset = useSharedValue({
    x: initialPosition.x,
    y: initialPosition.y,
  });

  const getCurrentWellData = (id: string) => {
    return (
      getCellArray({ layout, result: "wells", team }).find(
        (well) => well.id === id
      ) || null
    );
  };

  const translateX = useSharedValue(initialPosition.x);
  const translateY = useSharedValue(initialPosition.y);
  const currentWellDataSV = useSharedValue<Board.CellProps | null>(
    currentWellId ? getCurrentWellData(currentWellId) : null
  );
  const { onBoard, setOnBoard, myTurn } = usePieceState(
    team,
    currentWellId,
    id
  );
  const onBoardSV = useSharedValue(false);
  const isHeld = useSharedValue(false);
  const boardPieceLocationsSV = useSharedValue(layout.boardPieceLocations);

  useEffect(() => {
    boardPieceLocationsSV.value = layout.boardPieceLocations;
    console.log(layout.boardPieceLocations);
  }, [layout.boardPieceLocations]);

  useEffect(() => {
    if (currentWellId) {
      currentWellDataSV.value = getCurrentWellData(currentWellId);
    } else {
      currentWellDataSV.value = null;
    }
  }, [currentWellId]);
  //
  const setBoardPieceLocationsSV = (finalSpaceId: string) => {
    const updated = { ...layout.boardPieceLocations, [finalSpaceId]: id };

    layout.setBoardPieceLocations(updated);

    logic.checkGameFinished(updated);
  };
  //
  const setWellPieceLocationsSV = (wellId: string) => {
    layout.setWellPieceLocations((prev) => ({
      ...prev,
      [wellId]: id,
    }));
  };
  //
  const deleteWellPieceLocationSV = () => {
    if (currentWellId) {
      layout.setWellPieceLocations((prev) => {
        const updated = { ...prev };
        delete updated[currentWellId as string];
        return updated;
      });
    }
  };

  useEffect(() => {
    if (currentWellId) {
      layout.setWellPieceLocations((prev) => ({
        ...prev,
        [currentWellId]: id,
      }));
    }
  }, []);

  const movePiece = Gesture.Pan()
    .enabled(
      // (onBoard && logic.gameover) ||
      logic.gameState !== GameState.Finished && !onBoard && myTurn
    )
    .onStart(() => {
      isHeld.value = true;
      runOnJS(deleteWellPieceLocationSV)();
    })
    .onUpdate((event) => {
      translateX.value = event.absoluteX - GameElements.PIECE_RADIUS;
      translateY.value = event.absoluteY - GameElements.PIECE_RADIUS;
    })
    .onEnd(() => {
      isHeld.value = false;
      offset.value.x = translateX.value;
      offset.value.y = translateY.value;

      const pieceCenter = {
        x: translateX.value + GameElements.PIECE_RADIUS,
        y: translateY.value + GameElements.PIECE_RADIUS,
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

        const isSlot = selectedCell.id in layout.slots;
        const isSpace = selectedCell.id in layout.spaces;
        const isWell = selectedCell.id in layout.wells[team];

        let [nextRow, nextCol] = selectedCell.id.split("-").map(Number) as [
          number,
          number
        ];
        let prevRow: number | null = null;
        let prevCol: number | null = null;
        if (isSlot) {
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
            const nextSpace = layout.spaces[nextSpaceId];

            const isOccupied =
              boardPieceLocationsSV.value[nextSpaceId] !== undefined;

            if (
              nextRow < 0 ||
              nextRow >= GameElements.BOARD_SIZE ||
              nextCol < 0 ||
              nextCol >= GameElements.BOARD_SIZE
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
              // animateMisplacedPiece
              const well = currentWellDataSV.value;
              if (!well || !well.layout) return;
              translateX.value = withTiming(
                well.layout.pageX +
                  well.layout.width / 2 -
                  GameElements.PIECE_RADIUS,
                {
                  duration: Animations.WELL_RETURN_DURATION,
                  easing: Easing.inOut(Easing.quad),
                }
              );
              translateY.value = withTiming(
                well.layout.pageY +
                  well.layout.height / 2 -
                  GameElements.PIECE_RADIUS,
                {
                  duration: Animations.WELL_RETURN_DURATION,
                  easing: Easing.inOut(Easing.quad),
                }
              );
            }
            return;
          }

          const finalSpaceId = `${prevRow}-${prevCol}`;
          const finalSpaceLayout = layout.spaces[finalSpaceId];

          if (!finalSpaceLayout) {
            console.warn("No layout for final board space", finalSpaceId);
            return;
          }

          // Animate to slot
          translateX.value = withSequence(
            withTiming(scX + scWidth / 2 - GameElements.PIECE_RADIUS, {
              duration: Animations.SLOT_INSERT_DURATION,
              easing: Easing.inOut(Easing.quad),
            }),
            withTiming(
              finalSpaceLayout.pageX +
                finalSpaceLayout.width / 2 -
                GameElements.PIECE_RADIUS,
              {
                duration: Animations.SLOT_TO_SPACE_DURATION,
                easing: Easing.bounce,
              }
            )
          );

          translateY.value = withSequence(
            withTiming(scY + scHeight / 2 - GameElements.PIECE_RADIUS, {
              duration: Animations.SLOT_INSERT_DURATION,
              easing: Easing.inOut(Easing.quad),
            }),
            withTiming(
              finalSpaceLayout.pageY +
                finalSpaceLayout.width / 2 -
                GameElements.PIECE_RADIUS,
              {
                duration: Animations.SLOT_TO_SPACE_DURATION,
                easing: Easing.bounce,
              }
            )
          );

          runOnJS(setBoardPieceLocationsSV)(finalSpaceId);
        } else if (isSpace) {
          console.log("That space is blocked!");
          if (currentWellDataSV.value?.layout && currentWellDataSV.value?.id) {
            runOnJS(setWellPieceLocationsSV)(currentWellDataSV.value.id);

            // animateMisplacedPiece
            const well = currentWellDataSV.value;
            if (!well || !well.layout) return;
            translateX.value = withTiming(
              well.layout.pageX +
                well.layout.width / 2 -
                GameElements.PIECE_RADIUS,
              {
                duration: Animations.WELL_RETURN_DURATION,
                easing: Easing.inOut(Easing.quad),
              }
            );
            translateY.value = withTiming(
              well.layout.pageY +
                well.layout.height / 2 -
                GameElements.PIECE_RADIUS,
              {
                duration: Animations.WELL_RETURN_DURATION,
                easing: Easing.inOut(Easing.quad),
              }
            );
          }

          // Check N,S,E,W if there is no piece by the time you reach a slot
          // in one of those directions, break
          // Animate the piece to the slot in the slot in that direction.
          // It runs if slot
        } else if (isWell) {
          runOnJS(setWellPieceLocationsSV)(selectedCell.id);

          // animateMisplacedPiece({
          //   translateX,
          //   translateY,
          //   scX,
          //   scWidth,
          //   scY,
          //   scHeight,
          // });
          translateX.value = withTiming(
            scX + scWidth / 2 - GameElements.PIECE_RADIUS,
            {
              duration: Animations.WELL_RETURN_DURATION,
              easing: Easing.inOut(Easing.quad),
            }
          );
          translateY.value = withTiming(
            scY + scHeight / 2 - GameElements.PIECE_RADIUS,
            {
              duration: Animations.WELL_RETURN_DURATION,
              easing: Easing.inOut(Easing.quad),
            }
          );
        }
        // Piece placed on board
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
          // animateMisplacedPiece
          const well = currentWellDataSV.value;
          if (!well || !well.layout) return;
          translateX.value = withTiming(
            well.layout.pageX +
              well.layout.width / 2 -
              GameElements.PIECE_RADIUS,
            {
              duration: Animations.WELL_RETURN_DURATION,
              easing: Easing.inOut(Easing.quad),
            }
          );
          translateY.value = withTiming(
            well.layout.pageY +
              well.layout.height / 2 -
              GameElements.PIECE_RADIUS,
            {
              duration: Animations.WELL_RETURN_DURATION,
              easing: Easing.inOut(Easing.quad),
            }
          );
        }
      }
    });

  useBoardPullAnimation({
    pieceIdIn: id,
    boardPieceLocations: layout.boardPieceLocations,
    spaces: layout.spaces,
    translateX,
    translateY,
  });

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
    height: GameElements.PIECE_SIZE,
    width: GameElements.PIECE_SIZE,
    borderRadius: GameElements.PIECE_RADIUS,
    backgroundColor:
      team === Team.TeamOne
        ? settings.colorTheme.TEAM_ONE_COLOR
        : settings.colorTheme.TEAM_TWO_COLOR,
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
    shadowRadius: GameElements.PIECE_RADIUS,
    elevation: 8,
  };

  return (
    <>
      <GestureDetector gesture={movePiece}>
        <Animated.View style={[baseStyle, animatedStyles]}>
          <Highlight status={HighlightProps.Off} />
        </Animated.View>
      </GestureDetector>
    </>
  );
};

export default Piece;
