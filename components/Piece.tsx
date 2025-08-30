import { Animations, GameElements } from "@/constants";
import { BOARD_SIZE_ZERO_IDX } from "@/constants/gameElements";
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

  const slots = getCellArray({ layout, result: "slots", team });

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
  const foundSpace = useSharedValue(false);
  const isHeld = useSharedValue(false);
  const boardPieceLocationsSV = useSharedValue(layout.boardPieceLocations);
  type DropSlotData = { id: string; distance: number } | null;

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
      // (onBoard && logic.gameover) ||
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
          pageX: sourceCellCoordX,
          pageY: sourceCellCoordY,
          width: sourceCellWidth,
          height: sourceCellHeight,
        } = selectedCell.layout;

        const id = selectedCell.id;

        const cellFound =
          pieceCenter.x >= sourceCellCoordX &&
          pieceCenter.x <= sourceCellCoordX + sourceCellWidth &&
          pieceCenter.y >= sourceCellCoordY &&
          pieceCenter.y <= sourceCellCoordY + sourceCellHeight;

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
              runOnJS(setWPLUI)(currentWellDataSV.value.id);
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
            withTiming(
              sourceCellCoordX +
                sourceCellWidth / 2 -
                GameElements.PIECE_RADIUS,
              {
                duration: Animations.SLOT_INSERT_DURATION,
                easing: Easing.inOut(Easing.quad),
              }
            ),
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
            withTiming(
              sourceCellCoordY +
                sourceCellHeight / 2 -
                GameElements.PIECE_RADIUS,
              {
                duration: Animations.SLOT_INSERT_DURATION,
                easing: Easing.inOut(Easing.quad),
              }
            ),
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

          runOnJS(setBPLUI)(finalSpaceId);
        } else if (isSpace) {
          const getReachableSlot = (
            board: Record<string, string>,
            targetCell: string
          ) => {
            const [row, col] = targetCell.split("-").map(Number);

            const distanceToSlot: Record<string, number> = {
              Up: row,
              Down: BOARD_SIZE_ZERO_IDX - row,
              Right: BOARD_SIZE_ZERO_IDX - col,
              Left: col,
            };

            const directionVectors: Record<string, [number, number]> = {
              Up: [-1, 0],
              Down: [1, 0],
              Right: [0, 1],
              Left: [0, -1],
            };

            const direction: Record<string, string> = {
              Up: "Up",
              Down: "Down",
              Right: "Right",
              Left: "Left",
            };

            const reverseDirection: Record<string, string> = {
              Up: "Down",
              Down: "Up",
              Right: "Left",
              Left: "Right",
            };

            const cellStatus = (r: number, c: number, step: number) => {
              if (r === 0 || r === 8 || c === 0 || c === 8) {
                return step === 1 ? "slotNeighbor" : "slot";
              }
              const piece = board[`${r}-${c}`];
              if (piece) {
                return step === 1 ? "neighbor" : "blocked";
              }

              return "empty";
            };

            const layout: Record<string, any> = {};
            layout.dropSlot = { id: "null", distance: 99 };

            if (cellStatus(row, col, 0) === "blocked")
              return (layout.dropSlot = { id: "abort", distance: 99 });

            for (const dir of Object.values(direction)) {
              const [dRow, dCol] = directionVectors[dir];
              const distance = distanceToSlot[dir];

              for (let i = 1; i <= distance; i++) {
                const r = row + dRow * i;
                const c = col + dCol * i;
                const id = `${r}-${c}`;
                if (r > 8 || r < 0 || c > 8 || c < 0) {
                  return (layout.dropSlot = {
                    id: "out of bounds",
                    distance: 99,
                  });
                }
                const status = cellStatus(r, c, i);

                if (status === "empty") {
                  layout[dir] = { cell: status, id: id, distance: i };
                  continue;
                }

                if (status === "slotNeighbor") {
                  layout[dir] = { cell: status, id: id, distance: i };
                  break;
                } else if (status === "neighbor") {
                  layout[dir] = { cell: status, id: id, distance: i };
                  break;
                } else if (status === "blocked") {
                  layout[dir] = { cell: status, id: id, distance: i };
                  break;
                } else if (status === "slot") {
                  layout[dir] = { cell: status, id: id, distance: i };
                  break;
                }
              }
            }

            for (const dir of Object.keys(direction)) {
              const reverse = reverseDirection[dir];
              if (
                (layout[dir].cell === "slot" &&
                  layout[reverse].cell === "neighbor") ||
                (layout[dir].cell === "slot" &&
                  layout[reverse].cell === "slotNeighbor") ||
                (layout[dir].cell === "slotNeighbor" &&
                  layout[reverse].cell === "neighbor")
              ) {
                if (layout[dir].distance < layout.dropSlot.distance) {
                  layout.dropSlot = {
                    id: layout[dir].id,
                    distance: layout[dir].distance,
                  };
                }
              }
            }
            return layout;
          };
          const dropSlotData = getReachableSlot(layout.boardPieceLocations, id);
          if (dropSlotData.dropSlot) {
            const slotData = slots.find(
              (s) => s.id === dropSlotData.dropSlot.id
            );
            if (slotData) {
              foundSpace.value = true;

              translateX.value = withSequence(
                withTiming(
                  slotData!.layout!.pageX +
                    slotData!.layout!.width / 2 -
                    GameElements.PIECE_RADIUS,
                  {
                    duration: Animations.SLOT_INSERT_DURATION,
                    easing: Easing.inOut(Easing.quad),
                  }
                ),
                withTiming(
                  sourceCellCoordX +
                    sourceCellWidth / 2 -
                    GameElements.PIECE_RADIUS,
                  {
                    duration: Animations.SLOT_TO_SPACE_DURATION,
                    easing: Easing.bounce,
                  }
                )
              );

              translateY.value = withSequence(
                withTiming(
                  slotData!.layout!.pageY +
                    slotData!.layout!.height / 2 -
                    GameElements.PIECE_RADIUS,
                  {
                    duration: Animations.SLOT_INSERT_DURATION,
                    easing: Easing.inOut(Easing.quad),
                  }
                ),
                withTiming(
                  sourceCellCoordY +
                    sourceCellHeight / 2 -
                    GameElements.PIECE_RADIUS,
                  {
                    duration: Animations.SLOT_TO_SPACE_DURATION,
                    easing: Easing.bounce,
                  }
                )
              );
              runOnJS(setBPLUI)(id);
            } else {
              if (
                currentWellDataSV.value?.layout &&
                currentWellDataSV.value?.id
              ) {
                runOnJS(setWPLUI)(currentWellDataSV.value.id);
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
          }
        } else if (isWell) {
          runOnJS(setWPLUI)(selectedCell.id);

          // animateMisplacedPiece({
          //   translateX,
          //   translateY,
          //   sourceCellCoordX,
          //   sourceCellWidth,
          //   sourceCellCoordY,
          //   sourceCellHeight,
          // });
          translateX.value = withTiming(
            sourceCellCoordX + sourceCellWidth / 2 - GameElements.PIECE_RADIUS,
            {
              duration: Animations.WELL_RETURN_DURATION,
              easing: Easing.inOut(Easing.quad),
            }
          );
          translateY.value = withTiming(
            sourceCellCoordY + sourceCellHeight / 2 - GameElements.PIECE_RADIUS,
            {
              duration: Animations.WELL_RETURN_DURATION,
              easing: Easing.inOut(Easing.quad),
            }
          );
        }
        // Piece placed on board successfully
        if (isSlot || (isSpace && foundSpace.value)) {
          onBoardSV.value = true;
          runOnJS(setOnBoard)(true);
        }
      }
      if (noCellFound) {
        // console.log("Dropped outside any valid space");
        if (currentWellDataSV.value?.layout && currentWellDataSV.value?.id) {
          runOnJS(setWPLUI)(currentWellDataSV.value.id);
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
