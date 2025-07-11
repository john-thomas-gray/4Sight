import { useGameContext } from "@/context/GameContext";
import React, { useEffect, useRef, useState } from "react";
import { Animated, PanResponder, View, ViewStyle } from "react-native";

type PieceProps = {
  team?: "black" | "white";
  initialPosition?: { x: number; y: number };
  wellSpaces: {
    id: string;
    layout: { pageX: number; pageY: number; width: number; height: number };
  }[];
  slots: {
    id: string;
    layout: { pageX: number; pageY: number; width: number; height: number };
  }[];
  currentWellId?: string;
};

const BOARD_SIZE = 9;

const Piece = ({
  team = "white",
  initialPosition = { x: 0, y: 0 },
  wellSpaces,
  slots,
  currentWellId,
}: PieceProps) => {
  const pan = useRef(new Animated.ValueXY(initialPosition)).current;
  const [isDragging, setIsDragging] = useState(false);
  const pieceRef = useRef<View>(null);
  const {
    wellPieceLocations,
    setWellPieceLocations,
    boardSpaces,
    boardPieceLocations,
    setBoardPieceLocations,
  } = useGameContext();

  const boardPieceLocationsRef = useRef(boardPieceLocations);

  const currentWellIdRef = useRef<string | null>(currentWellId ?? null);
  const wellPieceLocationsRef = useRef(wellPieceLocations);

  useEffect(() => {
    wellPieceLocationsRef.current = wellPieceLocations;
  }, [wellPieceLocations]);

  useEffect(() => {
    boardPieceLocationsRef.current = boardPieceLocations;
  }, [boardPieceLocations]);

  useEffect(() => {
    pan.setValue(initialPosition);

    if (currentWellId) {
      setWellPieceLocations((prev) => ({
        ...prev,
        [currentWellId]: team,
      }));
    }
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        setIsDragging(true);

        if (currentWellIdRef.current) {
          setWellPieceLocations((prev) => {
            const updated = { ...prev };
            delete updated[currentWellIdRef.current as string];
            return updated;
          });
          currentWellIdRef.current = null;
        }

        pan.extractOffset();
      },

      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),

      onPanResponderRelease: () => {
        setIsDragging(false);

        pieceRef.current?.measure((x, y, width, height, pageX, pageY) => {
          const pieceCenter = {
            x: pageX + width / 2,
            y: pageY + height / 2,
          };

          const allTargets = [...wellSpaces, ...slots];

          for (const target of allTargets) {
            const {
              pageX: tx,
              pageY: ty,
              width: tWidth,
              height: tHeight,
            } = target.layout;

            const isInside =
              pieceCenter.x >= tx &&
              pieceCenter.x <= tx + tWidth &&
              pieceCenter.y >= ty &&
              pieceCenter.y <= ty + tHeight;

            if (isInside) {
              pan.flattenOffset();

              const isSlot = target.id.startsWith("slot-");

              if (isSlot) {
                const parts = target.id.split("-");
                if (parts.length !== 4) {
                  console.warn("Malformed slot ID:", target.id);
                  continue;
                }

                const [, orientation, rowStr, colStr] = parts;
                let row = parseInt(rowStr, 10);
                let col = parseInt(colStr, 10);

                // Adjacent starting position on board, one step inside from the slot
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

                // Loop forward until you find an occupied space or go out of bounds
                let prevRow = null;
                let prevCol = null;
                console.log(
                  "📦 boardPieceLocationsRef.current:",
                  boardPieceLocationsRef.current
                );

                while (true) {
                  if (
                    row < 0 ||
                    row >= BOARD_SIZE ||
                    col < 0 ||
                    col >= BOARD_SIZE
                  ) {
                    console.log("🔚 Out of bounds:", row, col);
                    break;
                  }

                  const boardId = `${row}-${col}`;
                  const boardLayout = boardSpaces[boardId];

                  console.log("🔍 Checking board space:", boardId);

                  if (!boardLayout) {
                    console.log("❌ No layout for", boardId);
                    break;
                  }

                  const isOccupied =
                    boardPieceLocationsRef.current[boardId] !== undefined;

                  if (isOccupied) {
                    console.log("🟥 Space is occupied:", boardId);
                    break;
                  }

                  console.log("✅ Space is unoccupied:", boardId);
                  prevRow = row;
                  prevCol = col;

                  // Step in the correct direction
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
                  console.warn(
                    "No free board space to move into near slot:",
                    target.id
                  );
                  return;
                }

                const finalBoardId = `${prevRow}-${prevCol}`;
                const finalBoardLayout = boardSpaces[finalBoardId];

                if (!finalBoardLayout) {
                  console.warn("No layout for final board space", finalBoardId);
                  return;
                }

                // Animate piece to slot first
                Animated.spring(pan, {
                  toValue: {
                    x: tx + tWidth / 2 - 16,
                    y: ty + tHeight / 2 - 16,
                  },
                  useNativeDriver: false,
                  speed: 1000,
                  bounciness: 0,
                }).start(() => {
                  // Animate piece to final board space (furthest unoccupied before occupied)
                  Animated.spring(pan, {
                    toValue: {
                      x:
                        finalBoardLayout.pageX +
                        finalBoardLayout.width / 2 -
                        16,
                      y:
                        finalBoardLayout.pageY +
                        finalBoardLayout.height / 2 -
                        16,
                    },
                    useNativeDriver: false,
                    speed: 20,
                    bounciness: 0,
                  }).start(() => {
                    // Update game state
                    currentWellIdRef.current = null;

                    setWellPieceLocations((prev) => {
                      const updated = { ...prev };
                      delete updated[target.id];
                      return updated;
                    });

                    setBoardPieceLocations((prev) => {
                      const updated = {
                        ...prev,
                        [finalBoardId]: team,
                      };
                      console.log("🧩 Occupied Spaces:", Object.keys(updated));
                      return updated;
                    });
                  });
                });
              } else {
                // Dropped in a well space
                setWellPieceLocations((prev) => ({
                  ...prev,
                  [target.id]: team,
                }));

                currentWellIdRef.current = target.id;

                Animated.spring(pan, {
                  toValue: {
                    x: tx + tWidth / 2 - 16,
                    y: ty + tHeight / 2 - 16,
                  },
                  useNativeDriver: false,
                }).start();
              }

              return;
            }
          }

          console.log("❌ Dropped outside any valid space");
        });
      },

      onPanResponderTerminate: () => {
        setIsDragging(false);
      },
    })
  ).current;

  const baseStyle: ViewStyle = {
    transform: pan.getTranslateTransform(),
    height: 32,
    width: 32,
    borderRadius: 16,
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

  const draggingStyle: ViewStyle = {
    height: 48,
    width: 48,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 8,
  };

  return (
    <Animated.View
      ref={pieceRef}
      {...panResponder.panHandlers}
      style={[baseStyle, isDragging && draggingStyle]}
    />
  );
};

export default Piece;
