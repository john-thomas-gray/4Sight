import {
  animateMisplacedPiece,
  animatePieceDrop,
  animateToSelectedCell,
} from "@/animations/animations";
import { GameElements } from "@/constants";
import { useGameContext } from "@/context/GameContext";
import useBoardPullAnimation from "@/hooks/useBoardPullAnimation";
import { usePieceState } from "@/hooks/usePieceState";
import { Board } from "@/types";
import { HighlightProps, PieceProps, Team } from "@/types/board";
import { GameState } from "@/types/logic";
import { getCellArray } from "@/utils/boardLogic";
import getReachableSlot from "@/utils/getReachableSlot";
import React, { useEffect } from "react";
import { ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
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

  const slots = getCellArray({ layout, result: "slots", team });

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
  const foundSpace = useSharedValue(false);
  const isHeld = useSharedValue(false);
  const boardPieceLocationsSV = useSharedValue(layout.boardPieceLocations);

  useEffect(() => {
    boardPieceLocationsSV.value = layout.boardPieceLocations;
    // console.log(layout.boardPieceLocations);
  }, [layout.boardPieceLocations]);

  useEffect(() => {
    if (currentWellId) {
      currentWellDataSV.value = getCurrentWellData(currentWellId);
    } else {
      currentWellDataSV.value = null;
    }
  }, [currentWellId]);
  //
  const setBPLUI = (finalSpaceId: string) => {
    const updated = { ...layout.boardPieceLocations, [finalSpaceId]: id };

    layout.setBoardPieceLocations(updated);
    logic.checkGameFinished(updated);
  };
  //
  const setWPLUI = (wellId: string) => {
    layout.setWellPieceLocations((prev) => ({
      ...prev,
      [wellId]: id,
    }));
  };
  //
  const deleteWPLUI = () => {
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
      // (onBoard
      // && logic.gameover) ||
      logic.gameState !== GameState.Finished && !onBoard
      // && myTurn
    )
    .onStart(() => {
      isHeld.value = true;
      runOnJS(deleteWPLUI)();
    })
    .onUpdate((event) => {
      translateX.value = event.absoluteX - GameElements.PIECE_RADIUS;
      translateY.value = event.absoluteY - GameElements.PIECE_RADIUS;
    })
    .onEnd(() => {
      isHeld.value = false;

      const pieceCenter = {
        x: translateX.value + GameElements.PIECE_RADIUS,
        y: translateY.value + GameElements.PIECE_RADIUS,
      };

      for (const selectedCell of allCells) {
        if (!selectedCell.layout) continue;

        const {
          pageX: selectedCellCoordX,
          pageY: selectedCellCoordY,
          width: selectedCellWidth,
          height: selectedCellHeight,
        } = selectedCell.layout;

        const cellFound =
          pieceCenter.x >= selectedCellCoordX &&
          pieceCenter.x <= selectedCellCoordX + selectedCellWidth &&
          pieceCenter.y >= selectedCellCoordY &&
          pieceCenter.y <= selectedCellCoordY + selectedCellHeight;
        if (!cellFound) continue;

        const id = selectedCell.id;
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
              runOnJS(setWPLUI)(currentWellDataSV.value.id);

              animateMisplacedPiece({
                translateX,
                translateY,
                currentWellDataSV,
              });
            }
            return;
          }

          const finalSpaceId = `${prevRow}-${prevCol}`;
          const finalSpaceLayout = layout.spaces[finalSpaceId];

          if (!finalSpaceLayout) {
            console.warn("No layout for final board space", finalSpaceId);
            return;
          }

          animatePieceDrop({
            translateX,
            translateY,
            slotX: selectedCellCoordX,
            slotY: selectedCellCoordY,
            slotWidth: selectedCellWidth,
            slotHeight: selectedCellHeight,
            spaceX: finalSpaceLayout.pageX,
            spaceY: finalSpaceLayout.pageY,
            spaceWidth: finalSpaceLayout.width,
            spaceHeight: finalSpaceLayout.height,
          });

          runOnJS(setBPLUI)(finalSpaceId);
        } else if (isSpace) {
          const dropSlotData = getReachableSlot(layout.boardPieceLocations, id);
          if (dropSlotData.dropSlot) {
            const slotData = slots.find(
              (s) => s.id === dropSlotData.dropSlot.id
            );
            if (slotData) {
              foundSpace.value = true;

              animatePieceDrop({
                translateX,
                translateY,
                slotX: slotData!.layout!.pageX,
                slotY: slotData!.layout!.pageY,
                slotWidth: slotData!.layout!.width,
                slotHeight: slotData!.layout!.height,
                spaceX: selectedCellCoordX,
                spaceY: selectedCellCoordY,
                spaceWidth: selectedCellWidth,
                spaceHeight: selectedCellHeight,
              });

              runOnJS(setBPLUI)(id);
            } else {
              if (
                currentWellDataSV.value?.layout &&
                currentWellDataSV.value?.id
              ) {
                runOnJS(setWPLUI)(currentWellDataSV.value.id);
                animateMisplacedPiece({
                  translateX,
                  translateY,
                  currentWellDataSV,
                });
              }
            }
          }
        } else if (isWell) {
          runOnJS(setWPLUI)(selectedCell.id);
          animateToSelectedCell({ translateX, translateY, selectedCell });
        }
        // Piece placed on board successfully
        if (isSlot || (isSpace && foundSpace.value)) {
          onBoardSV.value = true;
          runOnJS(setOnBoard)(true);
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
      // Scale, translateZ
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
