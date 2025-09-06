import animateGravity from "@/animations/animateGravity";
import {
  animatePieceDrop,
  animateToSelectedCell,
} from "@/animations/animations";
import { animateWinner } from "@/animations/pieceAnimations";
import { GameElements } from "@/constants";
import { useGameContext } from "@/context/GameContext";
import { usePieceState } from "@/hooks/usePieceState";
import { PieceProps, PieceState, Team } from "@/types/board";
import { getCellArray } from "@/utils/boardLogic";
import getReachableSlot from "@/utils/getReachableSlot";
import React, { useEffect, useState } from "react";
import { Button, View, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import Highlight from "./Highlight";

const Piece = ({ team, id, initialPosition, pieceState }: PieceProps) => {
  const { layout, logic, settings } = useGameContext();

  const allCells = getCellArray({ layout, result: "all", team });

  const slots = getCellArray({ layout, result: "slots", team });

  const translateX = useSharedValue(initialPosition.x);
  const translateY = useSharedValue(initialPosition.y);
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const skewX = useSharedValue("0deg");
  const skewY = useSharedValue("0deg");
  const rotation = useSharedValue(0);

  let currentWellId: string = "";
  if (
    Object.entries(layout.wellPieceLocations!).find(
      ([, pieceId]) => pieceId === id
    )?.[0]
  ) {
    currentWellId = Object.entries(layout.wellPieceLocations!).find(
      ([, pieceId]) => pieceId === id
    )?.[0]!;
  }

  const currentWellDataSV = useSharedValue(
    Object.entries(layout.wells[team]).find(
      ([wellId]) => wellId === currentWellId
    )?.[1] ?? null
  );
  const { onBoard, setOnBoard, myTurn } = usePieceState(team, currentWellId);

  const isHeld = useSharedValue(false);
  const boardPieceLocationsSV = useSharedValue(layout.boardPieceLocations);

  useEffect(() => {
    if (onBoard) {
      animateGravity({ pieceId: id, translateX, translateY, layout, logic });
    }
    boardPieceLocationsSV.value = layout.boardPieceLocations;
    // console.log(layout.wellPieceLocations);
  }, [layout.boardPieceLocations]);

  useEffect(() => {
    if (pieceState === PieceState.inWell) {
      currentWellDataSV.value =
        Object.entries(layout.wells[team]).find(
          ([wellId]) => wellId === currentWellId
        )?.[1] ?? null;
    } else {
      currentWellDataSV.value = null;
    }
  }, [currentWellId]);

  const setBPLUI = (finalSpaceId: string) => {
    const updated = { ...layout.boardPieceLocations, [finalSpaceId]: id };
    layout.setBoardPieceLocations(updated);
    logic.checkGameFinished(updated);
  };

  const setWPLUI = (wellId: string) => {
    layout.setWellPieceLocations((prev) => ({
      ...prev,
      [wellId]: id,
    }));
  };

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

  useEffect(() => {
    setHighlightProps(pieceState);
    if (pieceState === PieceState.winner) {
      // Run winner transition and then
      // loop winner animation
    }
    if (isHeld) {
    }
  }, [pieceState]);

  const [highlightProps, setHighlightProps] = useState(PieceState.inWell);

  const movePiece = Gesture.Pan()
    // .enabled(logic.gameState !== GameState.Finished && !onBoard && myTurn)
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
        if (!selectedCell.layout) {
          // animateMisplacedPiece({ translateX, translateY, currentWellDataSV });
          continue;
        }

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

              // animateMisplacedPiece({
              //   translateX,
              //   translateY,
              //   currentWellDataSV,
              // });
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
                // animateMisplacedPiece({
                //   translateX,
                //   translateY,
                //   currentWellDataSV,
                // });
              }
            }
          }
        } else if (isWell) {
          runOnJS(setWPLUI)(selectedCell.id);
          animateToSelectedCell({ translateX, translateY, selectedCell });
        }
        console.log(isWell, isSlot, isSpace);
      }
    });

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scaleX: scaleX.value },
      { scaleY: scaleY.value },
      { skewX: skewX.value },
      { skewY: skewY.value },
      { rotate: `${rotation.value}deg` },
    ],
    // shadows: [
    //   { shadowOpacity: shadowOpacity.value },
    //   { shadowRadius: shadowRadius },
    //   { shadowOffset: shadowOffset },
    // ],
  }));

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
          <Highlight props={highlightProps} />
        </Animated.View>
      </GestureDetector>
      <View style={{ position: "absolute", top: 10, left: 10 }}>
        <Button
          title="Test Animation"
          onPress={() => {
            animateWinner({
              translateX,
              translateY,
              scaleX,
              scaleY,
              skewX,
              skewY,
              rotation,
            });
          }}
        />
      </View>
    </>
  );
};

export default Piece;
