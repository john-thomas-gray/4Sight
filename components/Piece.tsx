import {
  animateMisplacedPiece,
  animatePieceDrop,
  animatePiecePickup,
  animatePieceRelease,
  animateToSelectedCell,
} from "@/animations/pieceAnimations";
import { GameElements } from "@/constants";
import {
  ANIMATE_MISPLACED_PIECE,
  ANIMATE_PIECE_DROP,
  WELL_RETURN,
} from "@/constants/animations";
import { useGameContext } from "@/context/GameContext";
import { Team } from "@/types/board";
import { GameState, PieceProps, PieceStatus } from "@/types/logic";
import { getCellArray } from "@/utils/boardLogic";
import getReachableSlot from "@/utils/getReachableSlot";
import React, { useEffect, useMemo } from "react";
import { ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import Highlight from "./Highlight";

const Piece = ({ team, id }: PieceProps) => {
  const { layout, logic, settings } = useGameContext();

  const set = () => {
    logic.setMoveInProgress(true);
  };
  const unset = (delay = 0) => {
    if (delay > 0) {
      logic.setMIP({ setting: false, delay });
    } else {
      logic.setMoveInProgress(false);
    }
  };
  const animate = useMemo(() => {
    return logic.pieceAnimations[id];
  }, [logic.pieceAnimations, id]);
  const status = useMemo(() => {
    return logic.pieceStatusMap[id];
  }, [logic.pieceStatusMap, id]);
  if (!animate) {
    throw new Error(`No animation found for piece id ${id}`);
  }

  // Initialize colors based on Team when the piece mounts or theme changes
  useEffect(() => {
    if (team === Team.TeamOne) {
      animate.color.value = settings.colorTheme.TEAM_ONE_COLOR;
      animate.winnerColor.value = settings.colorTheme.TEAM_ONE_WINNER_COLOR;
    } else {
      animate.color.value = settings.colorTheme.TEAM_TWO_COLOR;
      animate.winnerColor.value = settings.colorTheme.TEAM_TWO_WINNER_COLOR;
    }
  }, [
    team,
    animate.color,
    animate.winnerColor,
    settings.colorTheme.TEAM_ONE_COLOR,
    settings.colorTheme.TEAM_ONE_WINNER_COLOR,
    settings.colorTheme.TEAM_TWO_COLOR,
    settings.colorTheme.TEAM_TWO_WINNER_COLOR,
  ]);

  useEffect(() => {
    logic.setPieceStatusMap((prev) => ({
      ...prev,
      [id]: PieceStatus.inWell,
    }));
  }, []);

  const allCells = getCellArray({ layout, result: "all", team });

  const slots = getCellArray({ layout, result: "slots", team });

  const getCurrentWellData = () => {
    let CWID = "";
    const entry = Object.entries(logic.wellPieceLocations).find(
      ([, pieceId]) => pieceId === id
    );
    if (entry) {
      CWID = entry[0];
    }
    const currentWellData = getCellArray({
      layout,
      result: "wells",
      team,
    }).find((well) => well.id === CWID);
    return [CWID, currentWellData];
  };

  const [currentWellId, currentWellData] = getCurrentWellData();

  const currentWellDataSV = useSharedValue(currentWellData);

  const boardPieceLocationsSV = useSharedValue(logic.boardPieceLocations);

  useEffect(() => {
    boardPieceLocationsSV.value = logic.boardPieceLocations;
  }, [logic.boardPieceLocations]);

  const setBPLUI = (finalSpaceId: string) => {
    const updated = { ...logic.boardPieceLocations, [finalSpaceId]: id };
    logic.setBoardPieceLocations(updated);
  };

  const updateStatus = (status: PieceStatus) => {
    logic.setPieceStatusMap((prev) => ({
      ...prev,
      [id]: status,
    }));
  };

  const deleteWPLUI = () => {
    if (currentWellId) {
      logic.setWellPieceLocations((prev) => {
        const updated = { ...prev };
        delete updated[currentWellId as string];
        return updated;
      });
    }
  };

  useEffect(() => {
    if (team === Team.TeamOne) {
      if (status !== PieceStatus.winner) {
        animate.color.value = settings.colorTheme.TEAM_ONE_COLOR;
      }
    } else {
      if (status !== PieceStatus.winner) {
        animate.color.value = settings.colorTheme.TEAM_TWO_COLOR;
      }
    }
  }, [status]);

  const movePiece = useMemo(
    () =>
      Gesture.Pan()
        .enabled(
          logic.gameState !== GameState.Finished &&
            (status === PieceStatus.isHeld || status === PieceStatus.inWell) &&
            logic.currentTeam === team &&
            logic.moveInProgress === false
        )
        .hitSlop({ left: 24, right: 24, top: 24, bottom: 24 })
        .onStart(() => {
          animatePiecePickup({
            scaleX: animate.scaleX,
            scaleY: animate.scaleY,
            zIndex: animate.zIndex,
          });
          scheduleOnRN(deleteWPLUI);
          scheduleOnRN(updateStatus, PieceStatus.isHeld);
          console.log(logic.playersTurn);
        })
        .onUpdate((event) => {
          // if (logic.gameMode === GameMode.TwoPlayer) {
          //   if (logic.playersTurn % 2 === 1) {
          //     animate.translateX.value =
          //       event.absoluteX - GameElements.PIECE_RADIUS;
          //     animate.translateY.value =
          //       event.absoluteY - GameElements.PIECE_RADIUS - 40;
          //   } else if (logic.playersTurn % 2 === 0) {
          //     animate.translateX.value =
          //       event.absoluteX - GameElements.PIECE_RADIUS;
          //     animate.translateY.value =
          //       event.absoluteY - GameElements.PIECE_RADIUS + 40;
          //   }
          // } else {
          //   if (logic.playersTurn === 1) {
          //     animate.translateX.value =
          //       event.absoluteX - GameElements.PIECE_RADIUS;
          //     animate.translateY.value =
          //       event.absoluteY - GameElements.PIECE_RADIUS - 40;
          //   } else if (logic.playersTurn === 2) {
          //     animate.translateX.value =
          //       event.absoluteX - GameElements.PIECE_RADIUS - 40;
          //     animate.translateY.value =
          //       event.absoluteY - GameElements.PIECE_RADIUS;
          //   } else if (logic.playersTurn === 3) {
          //     animate.translateX.value =
          //       event.absoluteX - GameElements.PIECE_RADIUS;
          //     animate.translateY.value =
          //       event.absoluteY - GameElements.PIECE_RADIUS + 40;
          //   } else {
          //     animate.translateX.value =
          //       event.absoluteX - GameElements.PIECE_RADIUS + 40;
          //     animate.translateY.value =
          //       event.absoluteY - GameElements.PIECE_RADIUS;
          //   }
          // }
          animate.translateX.value =
            event.absoluteX - GameElements.PIECE_RADIUS;
          animate.translateY.value =
            event.absoluteY - GameElements.PIECE_RADIUS;

          // Log hover when held piece is over a slot
          if (status === PieceStatus.isHeld) {
            for (const cell of allCells) {
              if (!cell.layout) continue;
              const { pageX, pageY, width, height } = cell.layout;
              const inside =
                event.absoluteX >= pageX &&
                event.absoluteX <= pageX + width &&
                event.absoluteY >= pageY &&
                event.absoluteY <= pageY + height;
              if (inside && cell.id in layout.slots) {
                console.log("hover");
                break;
              }
            }
          }
        })
        .onEnd(() => {
          animatePieceRelease({
            scaleX: animate.scaleX,
            scaleY: animate.scaleY,
            zIndex: animate.zIndex,
          });
          const pieceCenter = {
            x: animate.translateX.value + GameElements.PIECE_RADIUS,
            y: animate.translateY.value + GameElements.PIECE_RADIUS,
          };

          for (const selectedCell of allCells) {
            // Add null check for layout
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
                  currentWellDataSV.value &&
                  typeof currentWellDataSV.value === "object" &&
                  currentWellDataSV.value.layout
                ) {
                  animateMisplacedPiece({
                    translateX: animate.translateX,
                    translateY: animate.translateY,
                    currentWellLayout: currentWellDataSV.value.layout,
                  });
                }
                scheduleOnRN(unset);
                return;
              }

              const finalSpaceId = `${prevRow}-${prevCol}`;
              const finalSpaceLayout = layout.spaces[finalSpaceId];

              if (!finalSpaceLayout) return;

              animatePieceDrop({
                translateX: animate.translateX,
                translateY: animate.translateY,
                slotLayout: selectedCell.layout,
                spaceLayout: finalSpaceLayout,
              });

              scheduleOnRN(setBPLUI, finalSpaceId);
              scheduleOnRN(updateStatus, PieceStatus.onBoard);
              scheduleOnRN(set);
              scheduleOnRN(unset, ANIMATE_PIECE_DROP);
              return;
            } else if (isSpace) {
              console.log("isSpace");
              // Check if the space is occupied
              const isOccupied = boardPieceLocationsSV.value[id] !== undefined;
              if (isOccupied) {
                if (
                  currentWellDataSV.value &&
                  typeof currentWellDataSV.value === "object" &&
                  currentWellDataSV.value.layout
                ) {
                  animateMisplacedPiece({
                    translateX: animate.translateX,
                    translateY: animate.translateY,
                    currentWellLayout: currentWellDataSV.value.layout,
                  });
                }
                scheduleOnRN(set);
                scheduleOnRN(unset, ANIMATE_MISPLACED_PIECE);
                return;
              }

              const dropSlotData = getReachableSlot(
                logic.boardPieceLocations,
                id
              );
              const slotData = slots.find(
                (s) => s.id === dropSlotData.dropSlot.id
              );
              if (!slotData) {
                if (
                  currentWellDataSV.value &&
                  typeof currentWellDataSV.value === "object" &&
                  currentWellDataSV.value.layout
                ) {
                  animateMisplacedPiece({
                    translateX: animate.translateX,
                    translateY: animate.translateY,
                    currentWellLayout: currentWellDataSV.value.layout,
                  });
                }
                scheduleOnRN(set);
                scheduleOnRN(unset, ANIMATE_MISPLACED_PIECE);
                return;
              }

              if (!slotData.layout) return;

              animatePieceDrop({
                translateX: animate.translateX,
                translateY: animate.translateY,
                slotLayout: slotData.layout,
                spaceLayout: selectedCell.layout,
              });

              scheduleOnRN(setBPLUI, id);
              scheduleOnRN(updateStatus, PieceStatus.onBoard);
              scheduleOnRN(set);
              scheduleOnRN(unset, ANIMATE_PIECE_DROP);
              return;
            } else if (isWell) {
              console.log("isWell");
              // Check if the well is occupied
              const isOccupied = logic.wellPieceLocations[id] !== undefined;
              if (isOccupied) {
                if (
                  currentWellDataSV.value &&
                  typeof currentWellDataSV.value === "object" &&
                  currentWellDataSV.value.layout
                ) {
                  animateMisplacedPiece({
                    translateX: animate.translateX,
                    translateY: animate.translateY,
                    currentWellLayout: currentWellDataSV.value.layout,
                  });
                }
                scheduleOnRN(set);
                scheduleOnRN(unset, ANIMATE_MISPLACED_PIECE);
                return;
              }

              animateToSelectedCell({
                translateX: animate.translateX,
                translateY: animate.translateY,
                selectedCell,
              });
              scheduleOnRN(set);
              scheduleOnRN(unset, WELL_RETURN);
              return;
            }
          }

          if (
            currentWellDataSV.value &&
            typeof currentWellDataSV.value === "object" &&
            currentWellDataSV.value.layout
          ) {
            animateMisplacedPiece({
              translateX: animate.translateX,
              translateY: animate.translateY,
              currentWellLayout: currentWellDataSV.value.layout,
            });
          }
          scheduleOnRN(set);
          scheduleOnRN(unset, ANIMATE_MISPLACED_PIECE);
          return;
        }),
    [logic.gameState, logic.currentTeam, status, logic.moveInProgress]
  );

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [
      { translateX: animate.translateX.value },
      { translateY: animate.translateY.value },
      { scaleX: animate.scaleX.value },
      { scaleY: animate.scaleY.value },
      { skewX: `${animate.skewX.value}deg` },
      { skewY: `${animate.skewY.value}deg` },
      { rotate: `${animate.rotation.value}deg` },
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
