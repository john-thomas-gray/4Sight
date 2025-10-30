import {
  animateBlockedPiece,
  animateBlockingPiece,
  animateMisplacedPiece,
  animatePieceToWell,
  elevationPieceToHeld,
  successfulPieceDrop,
} from "@/animations/pieceAnimations";
import { GameElements } from "@/constants";
import { ANIMATE_PIECE_DROP, RETURN_TO_WELL } from "@/constants/animations";
import { useGameContext } from "@/context/GameContext";
import {
  useLogicAnimations,
  useLogicBoardState,
  useLogicGameFlow,
  useLogicInteractions,
} from "@/context/LogicContext";
import { Direction, Team } from "@/types/board";
import { GameState, PieceProps, PieceStatus } from "@/types/logic";
import { getCellArray } from "@/utils/boardLogic";
import getReachableSlot from "@/utils/getReachableSlot";
import { pieceHoldOffset, pointerHoverOffset } from "@/utils/pieceHoldOffset";
import React, { memo, useEffect, useMemo } from "react";
import { ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import Highlight from "./Highlight";

const Piece = ({ team, id }: PieceProps) => {
  const { layout, settings } = useGameContext();
  const { gameMode } = useLogicGameFlow();
  const { moveInProgress } = useLogicInteractions();
  const { pieceAnimSharedValues, previewPieces } = useLogicAnimations();
  const { gameState, playerCanMove, setPlayerCanMove, currentTeam } =
    useLogicGameFlow();
  const {
    pieceStatusMap,
    wellPieceLocations,
    boardPieceLocations,
    setBoardPieceLocations,
    setWellPieceLocations,
    setPieceStatusMap,
  } = useLogicBoardState();
  const { setMoveInProgress, setMIP } = useLogicInteractions();

  const unsetMoveInProgress = (delay = 0) => {
    if (delay > 0) {
      setMIP({ setting: false, delay });
    } else {
      setMoveInProgress(false);
    }
  };
  const animate = useMemo(() => {
    return pieceAnimSharedValues[id];
  }, [pieceAnimSharedValues, id]);
  const status = useMemo(() => {
    return pieceStatusMap[id];
  }, [pieceStatusMap, id]);
  if (!animate) {
    throw new Error(`No animation found for piece id ${id}`);
  }

  useEffect(() => {
    if (team === Team.TeamOne) {
      animate.color.value =
        settings.theme?.colorTheme?.TEAM_ONE_COLOR || "#ffffff";
      animate.winnerColor.value =
        settings.theme?.colorTheme?.TEAM_ONE_WINNER_COLOR || "#fdffd0ff";
    } else {
      animate.color.value =
        settings.theme?.colorTheme?.TEAM_TWO_COLOR || "#000000";
      animate.winnerColor.value =
        settings.theme?.colorTheme?.TEAM_TWO_WINNER_COLOR || "#967d00ff";
    }
  }, [
    team,
    animate.color,
    animate.winnerColor,
    settings.theme?.colorTheme?.TEAM_ONE_COLOR,
    settings.theme?.colorTheme?.TEAM_ONE_WINNER_COLOR,
    settings.theme?.colorTheme?.TEAM_TWO_COLOR,
    settings.theme?.colorTheme?.TEAM_TWO_WINNER_COLOR,
  ]);

  useEffect(() => {
    setPieceStatusMap((prev) => ({
      ...prev,
      [id]: PieceStatus.inWell,
    }));
  }, [id, setPieceStatusMap]);

  const allCells = getCellArray({ layout, result: "all", team });

  const slots = getCellArray({ layout, result: "slots", team });

  const getCurrentWellData = () => {
    let CWID = "";
    const entry = Object.entries(wellPieceLocations).find(
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

  const boardPieceLocationsSV = useSharedValue(boardPieceLocations);

  useEffect(() => {
    boardPieceLocationsSV.value = boardPieceLocations;
  }, [boardPieceLocations, boardPieceLocationsSV]);

  const setBPLUI = (finalSpaceId: string) => {
    const updated = { ...boardPieceLocations, [finalSpaceId]: id };
    setBoardPieceLocations(updated);
  };

  const updateStatus = (status: PieceStatus) => {
    setPieceStatusMap((prev) => ({
      ...prev,
      [id]: status,
    }));
  };

  const deleteWPLUI = () => {
    if (currentWellId) {
      setWellPieceLocations((prev) => {
        const updated = { ...prev };
        delete updated[currentWellId as string];
        return updated;
      });
    }
  };

  const setWPLUI = (targetWellId: string) => {
    const wellIdToSet = targetWellId;

    setWellPieceLocations((prev) => ({
      ...prev,
      [wellIdToSet]: id,
    }));
    console.log(wellPieceLocations);
  };

  useEffect(() => {
    if (team === Team.TeamOne) {
      if (status !== PieceStatus.winner) {
        animate.color.value =
          settings.theme?.colorTheme?.TEAM_ONE_COLOR || "#ffffff";
      }
    } else {
      if (status !== PieceStatus.winner) {
        animate.color.value =
          settings.theme?.colorTheme?.TEAM_TWO_COLOR || "#000000";
      }
    }
  }, [
    status,
    team,
    animate.color,
    settings.theme?.colorTheme?.TEAM_ONE_COLOR,
    settings.theme?.colorTheme?.TEAM_TWO_COLOR,
  ]);

  const [hoverSpaceId, setHoverSpaceId] = React.useState<string | null>(null);
  const setHover = (spaceId: string | null) => {
    setHoverSpaceId(spaceId);
  };

  const unassignedTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const assignTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    return () => {
      if (unassignedTimeoutRef.current)
        clearTimeout(unassignedTimeoutRef.current);
      if (assignTimeoutRef.current) clearTimeout(assignTimeoutRef.current);
    };
  }, []);

  const assignEarlyMove = (team: Team) => {
    const nextTeam =
      team === Team.TeamOne
        ? Team.TeamTwo
        : Team.TeamTwo
        ? Team.TeamOne
        : Team.Unassigned;

    if (unassignedTimeoutRef.current)
      clearTimeout(unassignedTimeoutRef.current);
    if (assignTimeoutRef.current) clearTimeout(assignTimeoutRef.current);

    unassignedTimeoutRef.current = setTimeout(
      () => setPlayerCanMove(Team.Unassigned),
      300
    );
    assignTimeoutRef.current = setTimeout(
      () => setPlayerCanMove(nextTeam),
      500
    );
  };

  const movePiece = useMemo(
    () =>
      Gesture.Pan()
        .enabled(
          (gameState !== GameState.Finished &&
            gameState !== GameState.PostGame &&
            team === currentTeam) ||
            (playerCanMove === team &&
              (status === PieceStatus.isHeld ||
                (status === PieceStatus.inWell && moveInProgress === false)))
        )
        .hitSlop({ left: 24, right: 24, top: 24, bottom: 24 })
        .onStart(() => {
          elevationPieceToHeld({
            scaleX: animate.scaleX,
            scaleY: animate.scaleY,
            zIndex: animate.zIndex,
          });
          scheduleOnRN(deleteWPLUI);
          scheduleOnRN(updateStatus, PieceStatus.isHeld);
          scheduleOnRN(setMoveInProgress, true);
        })
        .onUpdate((event) => {
          pieceHoldOffset(
            gameMode,
            team,
            animate.translateX,
            animate.translateY,
            event.absoluteX,
            event.absoluteY,
            GameElements.PIECE_RADIUS,
            true
          );

          if (status === PieceStatus.isHeld) {
            let overAnySlot = false;

            const { adjustedX, adjustedY } = pointerHoverOffset(
              gameMode,
              team,
              event.absoluteX,
              event.absoluteY
            );

            for (const cell of allCells) {
              if (!cell.layout) continue;
              const { pageX, pageY, width, height } = cell.layout;
              const inside =
                adjustedX >= pageX &&
                adjustedX <= pageX + width &&
                adjustedY >= pageY &&
                adjustedY <= pageY + height;
              if (inside && cell.id in layout.slots) {
                overAnySlot = true;
                let [nextRow, nextCol] = cell.id.split("-").map(Number) as [
                  number,
                  number
                ];
                const slotDirection =
                  nextRow === 8
                    ? Direction.Up
                    : nextRow === 0
                    ? Direction.Down
                    : nextCol === 0
                    ? Direction.Right
                    : Direction.Left;
                const deltas: Record<Direction, { dr: number; dc: number }> = {
                  [Direction.Up]: { dr: -1, dc: 0 },
                  [Direction.Down]: { dr: 1, dc: 0 },
                  [Direction.Right]: { dr: 0, dc: 1 },
                  [Direction.Left]: { dr: 0, dc: -1 },
                };
                nextRow += deltas[slotDirection].dr;
                nextCol += deltas[slotDirection].dc;

                let prevRow: number | null = null;
                let prevCol: number | null = null;

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

                if (prevRow !== null && prevCol !== null) {
                  const finalSpaceId = `${prevRow}-${prevCol}`;
                  scheduleOnRN(setHover, finalSpaceId);
                } else {
                  scheduleOnRN(setHover, null);
                }
                break;
              }
            }
            if (!overAnySlot) {
              scheduleOnRN(setHover, null);
            }
          }
        })
        .onEnd(() => {
          scheduleOnRN(setHover, null);
          scheduleOnRN(assignEarlyMove, team);
          const pieceCenter = {
            x: animate.translateX.value + GameElements.PIECE_RADIUS,
            y: animate.translateY.value + GameElements.PIECE_RADIUS,
          };
          /* DETECT WHICH CELL THE PIECE WAS DROPPED ON */
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
                  ? Direction.Up
                  : nextRow === 0
                  ? Direction.Down
                  : nextCol === 0
                  ? Direction.Right
                  : Direction.Left;

              const deltas: Record<Direction, { dr: number; dc: number }> = {
                [Direction.Up]: { dr: -1, dc: 0 },
                [Direction.Down]: { dr: 1, dc: 0 },
                [Direction.Right]: { dr: 0, dc: 1 },
                [Direction.Left]: { dr: 0, dc: -1 },
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
              /* AN ADJACENT PIECE BLOCKS THE SLOT */
              if (prevRow === null || prevCol === null) {
                if (
                  currentWellDataSV.value &&
                  typeof currentWellDataSV.value === "object" &&
                  currentWellDataSV.value.layout
                ) {
                  animateBlockedPiece({
                    translateX: animate.translateX,
                    translateY: animate.translateY,
                    slotLayout: selectedCell.layout,
                    currentWellLayout: currentWellDataSV.value.layout,
                    direction: slotDirection,
                    scaleX: animate.scaleX,
                    scaleY: animate.scaleY,
                    zIndex: animate.zIndex,
                  });

                  const blockingSpaceId = `${nextRow}-${nextCol}`;
                  const blockingPieceId =
                    boardPieceLocationsSV.value[blockingSpaceId];
                  if (blockingPieceId) {
                    const blockingPieceAnimation =
                      pieceAnimSharedValues[blockingPieceId];
                    const blockingSpaceLayout = layout.spaces[blockingSpaceId];
                    if (blockingPieceAnimation && blockingSpaceLayout) {
                      animateBlockingPiece({
                        translateX: blockingPieceAnimation.translateX,
                        translateY: blockingPieceAnimation.translateY,
                        blockedSpaceLayout: blockingSpaceLayout,
                        direction: slotDirection,
                      });
                    }
                  }
                }
                // Return status to inWell since placement didn't occur
                scheduleOnRN(updateStatus, PieceStatus.inWell);
                if (
                  currentWellDataSV.value &&
                  typeof currentWellDataSV.value === "object" &&
                  "id" in currentWellDataSV.value
                ) {
                  scheduleOnRN(setWPLUI, currentWellDataSV.value.id);
                }
                scheduleOnRN(unsetMoveInProgress);
                return;
              }

              const finalSpaceId = `${prevRow}-${prevCol}`;
              const finalSpaceLayout = layout.spaces[finalSpaceId];

              if (!finalSpaceLayout) return;

              successfulPieceDrop({
                translateX: animate.translateX,
                translateY: animate.translateY,
                slotLayout: selectedCell.layout,
                spaceLayout: finalSpaceLayout,
                scaleX: animate.scaleX,
                scaleY: animate.scaleY,
                zIndex: animate.zIndex,
              });

              scheduleOnRN(setBPLUI, finalSpaceId);
              scheduleOnRN(updateStatus, PieceStatus.onBoard);
              scheduleOnRN(unsetMoveInProgress, ANIMATE_PIECE_DROP);
              return;
            } else if (isSpace) {
              const isOccupied = boardPieceLocationsSV.value[id] !== undefined;
              if (isOccupied) {
                if (
                  currentWellDataSV.value &&
                  typeof currentWellDataSV.value === "object" &&
                  currentWellDataSV.value.layout
                ) {
                  animateMisplacedPiece({
                    scaleX: animate.scaleX,
                    scaleY: animate.scaleY,
                    zIndex: animate.zIndex,
                    translateX: animate.translateX,
                    translateY: animate.translateY,
                    currentWellLayout: currentWellDataSV.value.layout,
                  });
                }

                scheduleOnRN(updateStatus, PieceStatus.inWell);
                scheduleOnRN(unsetMoveInProgress, RETURN_TO_WELL);
                return;
              }

              const dropSlotData = getReachableSlot(boardPieceLocations, id);
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
                    scaleX: animate.scaleX,
                    scaleY: animate.scaleY,
                    zIndex: animate.zIndex,

                    translateX: animate.translateX,
                    translateY: animate.translateY,
                    currentWellLayout: currentWellDataSV.value.layout,
                  });
                }

                if (
                  currentWellDataSV.value &&
                  typeof currentWellDataSV.value === "object" &&
                  "id" in currentWellDataSV.value
                ) {
                  scheduleOnRN(setWPLUI, currentWellDataSV.value.id);
                }
                scheduleOnRN(updateStatus, PieceStatus.inWell);
                scheduleOnRN(unsetMoveInProgress, RETURN_TO_WELL);
                return;
              }

              if (!slotData.layout) return;

              successfulPieceDrop({
                translateX: animate.translateX,
                translateY: animate.translateY,
                slotLayout: slotData.layout,
                spaceLayout: selectedCell.layout,
                scaleX: animate.scaleX,
                scaleY: animate.scaleY,
                zIndex: animate.zIndex,
              });

              scheduleOnRN(setBPLUI, id);
              scheduleOnRN(updateStatus, PieceStatus.onBoard);

              scheduleOnRN(unsetMoveInProgress, ANIMATE_PIECE_DROP);
              return;
            } else if (isWell) {
              const isOccupied = wellPieceLocations[id] !== undefined;
              if (isOccupied) {
                if (
                  currentWellDataSV.value &&
                  typeof currentWellDataSV.value === "object" &&
                  currentWellDataSV.value.layout
                ) {
                  animateMisplacedPiece({
                    scaleX: animate.scaleX,
                    scaleY: animate.scaleY,
                    zIndex: animate.zIndex,
                    translateX: animate.translateX,
                    translateY: animate.translateY,
                    currentWellLayout: currentWellDataSV.value.layout,
                  });
                }

                if (
                  currentWellDataSV.value &&
                  typeof currentWellDataSV.value === "object" &&
                  "id" in currentWellDataSV.value
                ) {
                  scheduleOnRN(setWPLUI, currentWellDataSV.value.id);
                }
                scheduleOnRN(updateStatus, PieceStatus.inWell);
                scheduleOnRN(unsetMoveInProgress, RETURN_TO_WELL);
                return;
              }

              animatePieceToWell({
                translateX: animate.translateX,
                translateY: animate.translateY,
                selectedCell,
                scaleX: animate.scaleX,
                scaleY: animate.scaleY,
                zIndex: animate.zIndex,
              });

              scheduleOnRN(setWPLUI, selectedCell.id);
              scheduleOnRN(unsetMoveInProgress, RETURN_TO_WELL);
              return;
            }
          }

          if (
            currentWellDataSV.value &&
            typeof currentWellDataSV.value === "object" &&
            currentWellDataSV.value.layout
          ) {
            animateMisplacedPiece({
              scaleX: animate.scaleX,
              scaleY: animate.scaleY,
              zIndex: animate.zIndex,
              translateX: animate.translateX,
              translateY: animate.translateY,
              currentWellLayout: currentWellDataSV.value.layout,
            });
          }
          // Return status to inWell since placement didn't occur
          scheduleOnRN(updateStatus, PieceStatus.inWell);
          scheduleOnRN(unsetMoveInProgress);
          if (
            currentWellDataSV.value &&
            typeof currentWellDataSV.value === "object" &&
            "id" in currentWellDataSV.value
          ) {
            scheduleOnRN(setWPLUI, currentWellDataSV.value.id);
          }
          return;
        }),
    [
      status,
      animate.scaleX,
      animate.scaleY,
      animate.translateX,
      animate.translateY,
      animate.zIndex,
      layout.slots,
      layout.spaces,
      layout.wells,
      boardPieceLocations,
      pieceAnimSharedValues,
      ,
      updateStatus,
      setMoveInProgress,
      unsetMoveInProgress,
      setBPLUI,
      setWPLUI,
      wellPieceLocations,
    ]
  );
  const animatedStyles = useAnimatedStyle(() => ({
    transform: [
      { translateX: animate.translateX.value },
      { translateY: animate.translateY.value },
      { scaleX: animate.scaleX.value },
      { scaleY: animate.scaleY.value },
    ],
    zIndex: animate.zIndex.value,
    backgroundColor: animate.color.value,
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
        <Animated.View
          pointerEvents={status === PieceStatus.onBoard ? "none" : "auto"}
          style={[
            baseStyle,
            animatedStyles,
            status === PieceStatus.inWell
              ? { zIndex: GameElements.PIECE_WELL_ZINDEX }
              : null,
            previewPieces[id] ? { opacity: 0 } : null,
          ]}
        >
          <Highlight pieceId={id} />
          {/* Shine accent following the curve of the piece's edge */}
          <Animated.View
            style={{
              position: "absolute",
              top: GameElements.PIECE_SIZE * 0.2,
              right: GameElements.PIECE_SIZE * 0.1,
              width: GameElements.PIECE_SIZE * 0.4,
              height: GameElements.PIECE_SIZE * 0.2,
              borderRadius: GameElements.PIECE_RADIUS,
              backgroundColor: "rgba(200, 200, 200, 0.6)",
              transform: [{ rotate: "40deg" }],
              zIndex: 1,
            }}
          />
        </Animated.View>
      </GestureDetector>
      {hoverSpaceId && settings.piecePlacementPreviews && (
        <Animated.View
          style={{
            position: "absolute",
            height: GameElements.PIECE_SIZE,
            width: GameElements.PIECE_SIZE,
            borderRadius: GameElements.PIECE_RADIUS,
            borderWidth: 2,
            borderColor: "#9CA3AF",
            zIndex: 2000,
            backgroundColor:
              team === Team.TeamOne
                ? settings.theme?.colorTheme?.TEAM_ONE_COLOR || "#ffffff"
                : settings.theme?.colorTheme?.TEAM_TWO_COLOR || "#000000",
            opacity: 0.35,
            left:
              layout.spaces[hoverSpaceId].pageX +
              layout.spaces[hoverSpaceId].width / 2 -
              GameElements.PIECE_RADIUS,
            top:
              layout.spaces[hoverSpaceId].pageY +
              layout.spaces[hoverSpaceId].height / 2 -
              GameElements.PIECE_RADIUS,
          }}
        />
      )}
    </>
  );
};

export default memo(Piece);
