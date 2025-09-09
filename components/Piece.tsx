import {
  animateMisplacedPiece,
  animatePieceDrop,
  animateToSelectedCell,
} from "@/animations/animations";
import { GameElements } from "@/constants";
import { RESTRICTIONS_OFF } from "@/constants/logic";
import { useGameContext } from "@/context/GameContext";
import { Board } from "@/types";
import { Team } from "@/types/board";
import { GameState, PieceProps, PieceStatus } from "@/types/logic";
import { getCellArray } from "@/utils/boardLogic";
import getReachableSlot from "@/utils/getReachableSlot";
import React, { useEffect, useMemo } from "react";
import { ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import Highlight from "./Highlight";

const Piece = ({ team, id }: PieceProps) => {
  const { layout, logic, settings } = useGameContext();
  const animate = useMemo(() => {
    return logic.pieceAnimations[id];
  }, [logic.pieceAnimations, id]);
  const status = useMemo(() => {
    return logic.pieceStatusMap[id];
  }, [logic.pieceStatusMap, id]);
  if (!animate) {
    throw new Error(`No animation found for piece id ${id}`);
  }

  useEffect(() => {
    logic.setPieceStatusMap((prev) => ({
      ...prev,
      [id]: PieceStatus.inWell,
    }));
  }, []);

  const allCells = getCellArray({ layout, result: "all", team });

  const slots = getCellArray({ layout, result: "slots", team });

  const getCurrentWellData = (id: string) => {
    return (
      getCellArray({ layout, result: "wells", team }).find(
        (well) => well.id === id
      ) || null
    );
  };

  let currentWellId: string = "";
  const entry = Object.entries(layout.wellPieceLocations!).find(
    ([, pieceId]) => pieceId === id
  );

  if (entry) {
    currentWellId = entry[0];
  }

  useEffect(() => {
    if (status === PieceStatus.inWell) {
      getCurrentWellData(id);
    } else {
      currentWellDataSV.value = null;
    }
  }, [currentWellId]);

  const currentWellDataSV = useSharedValue<Board.CellProps | null>(
    currentWellId ? getCurrentWellData(currentWellId) : null
  );

  const boardPieceLocationsSV = useSharedValue(layout.boardPieceLocations);

  useEffect(() => {
    boardPieceLocationsSV.value = layout.boardPieceLocations;
  }, [layout.boardPieceLocations]);

  const setBPLUI = (finalSpaceId: string) => {
    const updated = { ...layout.boardPieceLocations, [finalSpaceId]: id };
    layout.setBoardPieceLocations(updated);
  };

  const setWPLUI = (wellId: string) => {
    layout.setWellPieceLocations((prev) => ({
      ...prev,
      [wellId]: id,
    }));
  };

  const updateStatus = (status: PieceStatus) => {
    logic.setPieceStatusMap((prev) => ({
      ...prev,
      [id]: status,
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
    if (team === Team.TeamOne) {
      animate.color.value = settings.colorTheme.TEAM_ONE_COLOR;
      // animate.winnerColor.value = settings.colorTheme.TEAM_ONE_WINNER_COLOR;
    } else {
      animate.color.value = settings.colorTheme.TEAM_TWO_COLOR;
      animate.winnerColor.value = settings.colorTheme.TEAM_TWO_WINNER_COLOR;
    }
  }, []);
  const movePiece = Gesture.Pan()
    .enabled(
      RESTRICTIONS_OFF || logic.gameState !== GameState.Finished &&
        (status === PieceStatus.isHeld || status === PieceStatus.inWell)
    )
    .onStart(() => {
      runOnJS(deleteWPLUI)();
      runOnJS(updateStatus)(PieceStatus.isHeld);
    })
    .onUpdate((event) => {
      animate.translateX.value = event.absoluteX - GameElements.PIECE_RADIUS;
      animate.translateY.value = event.absoluteY - GameElements.PIECE_RADIUS;
    })
    .onEnd(() => {
      console.log("blah");
      const pieceCenter = {
        x: animate.translateX.value + GameElements.PIECE_RADIUS,
        y: animate.translateY.value + GameElements.PIECE_RADIUS,
      };

      for (const selectedCell of allCells) {
        const {
          pageX: selectedCellCoordX,
          pageY: selectedCellCoordY,
          width: selectedCellWidth,
          height: selectedCellHeight,
          // !@#
        } = selectedCell.layout!;

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
          console.log("isSlot");
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
            console.warn(
              "No free board space near slot. Slot blocked!:",
              selectedCell.id
            );
            if (
              currentWellDataSV.value?.layout &&
              currentWellDataSV.value?.id
            ) {
              runOnJS(setWPLUI)(currentWellDataSV.value.id);

              animateMisplacedPiece({
                translateX: animate.translateX,
                translateY: animate.translateY,
                currentWellLayout: currentWellDataSV.value.layout,
              });
            }
            return;
          }

          const finalSpaceId = `${prevRow}-${prevCol}`;
          const finalSpaceLayout = layout.spaces[finalSpaceId];

          if (!finalSpaceLayout) {
            return;
          }

          animatePieceDrop({
            translateX: animate.translateX,
            translateY: animate.translateY,
            slotLayout: selectedCell.layout!,
            spaceLayout: finalSpaceLayout,
          });

          runOnJS(setBPLUI)(finalSpaceId);
          runOnJS(updateStatus)(PieceStatus.onBoard);
          return;
        } else if (isSpace) {
          console.log("isSpace");
          const dropSlotData = getReachableSlot(layout.boardPieceLocations, id);
          const slotData = slots.find((s) => s.id === dropSlotData.dropSlot.id);
          if (!slotData) {
            animateMisplacedPiece({
              translateX: animate.translateX,
              translateY: animate.translateY,
              currentWellLayout: currentWellDataSV!.value!.layout!,
            });
            continue;
          }
          animatePieceDrop({
            translateX: animate.translateX,
            translateY: animate.translateY,
            slotLayout: slotData!.layout!,
            spaceLayout: selectedCell.layout!,
          });

          runOnJS(setBPLUI)(id);
          runOnJS(updateStatus)(PieceStatus.onBoard);

          return;
        } else if (isWell) {
          console.log("isWell");
          animateToSelectedCell({
            translateX: animate.translateX,
            translateY: animate.translateY,
            selectedCell,
          });
          return;
        }
      }
      console.log("hi");
      // animateMisplacedPiece({
      //   translateX: animate.translateX,
      //   translateY: animate.translateY,
      //   currentWellLayout: currentWellDataSV!.value!.layout!,
      // });
      return;
    });

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [
      { translateX: animate.translateX.value },
      { translateY: animate.translateY.value },
      { scaleX: animate.scaleX!.value },
      { scaleY: animate.scaleY!.value },
      { skewX: `${animate.skewX!.value}deg` },
      { skewY: `${animate.skewY!.value}deg` },
      { rotate: `${animate.rotation!.value}deg` },
    ],
    backgroundColor: animate.color.value,
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
    borderWidth: 2,
    borderColor: "#9CA3AF",
    zIndex: 500,
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
          <Highlight pieceId={id} />
        </Animated.View>
      </GestureDetector>
    </>
  );
};

export default Piece;
