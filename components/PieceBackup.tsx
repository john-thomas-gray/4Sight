import { useGameContext } from "@/context/GameContext";
import React, { useEffect, useRef, useState } from "react";
import { Animated, PanResponder, View, ViewStyle } from "react-native";

type PieceProps = {
  team?: "black" | "white";
  id?: string;
  initialPosition?: { x: number; y: number };
  currentWellId?: string;
  currentBoardId?: string;
};

const BOARD_SIZE = 9;

const Piece = ({
  team = "white",
  id = "X-0",
  initialPosition = { x: 0, y: 0 },
  currentWellId,
  currentBoardId,
}: PieceProps) => {
  const pan = useRef(new Animated.ValueXY(initialPosition)).current;
  const [isDragging, setIsDragging] = useState(false);
  const pieceRef = useRef<View>(null);

  const {
    wellSpaces,
    slots,
    boardSpaces,
    boardPieceLocations,
    setBoardPieceLocations,
    wellPieceLocations,
    setWellPieceLocations,
  } = useGameContext();

  const wellSpaceArray = Object.entries(wellSpaces[team]).map(
    ([id, layout]) => ({
      id,
      layout,
    })
  );

  const slotArray = Object.entries(slots).map(([id, data]) => ({
    id,
    layout: data.layout,
  }));

  const allTargets = [...wellSpaceArray, ...slotArray];
  const currentBoardIdRef = useRef<string | null>(currentBoardId ?? null);
  const boardPieceLocationsRef = useRef(boardPieceLocations);
  const currentWellIdRef = useRef<string | null>(currentWellId ?? null);
  const wellPieceLocationsRef = useRef(wellPieceLocations);

  // UPDATE THE STATE OF THE PIECES IN THE WELL
  useEffect(() => {
    wellPieceLocationsRef.current = wellPieceLocations;
  }, [wellPieceLocations]);

  // UPDATE THE STATE OF THE PIECES ON THE BOARD
  useEffect(() => {
    boardPieceLocationsRef.current = boardPieceLocations;
  }, [boardPieceLocations]);

  // HANDLES PULLING ANIMATION
  useEffect(() => {
    const boardId = Object.entries(boardPieceLocations).find(
      ([spaceId, pieceId]) => pieceId === id
    )?.[0];

    if (boardId && boardSpaces[boardId]) {
      const layout = boardSpaces[boardId];
      // // UNNECESSARY?
      Animated.spring(pan, {
        toValue: {
          x: layout.pageX + layout.width / 2 - 16,
          y: layout.pageY + layout.height / 2 - 16,
        },
        useNativeDriver: false,
        speed: 20,
        bounciness: 10,
      }).start();

      currentBoardIdRef.current = boardId;
    }
  }, [boardPieceLocations, boardSpaces]);

  console.log(wellPieceLocations);
  // SET THE INITIAL LOCATION FOR THE WELL PIECES IN CONTEXT
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
        // DELETE THE CURRENT PIECE'S ID FROM ITS WELL
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

        // SET THE PIECE REFERENCE TO THE VALUES WHERE IT WAS DROPPED
        pieceRef.current?.measure((x, y, width, height, pageX, pageY) => {
          const pieceCenter = {
            x: pageX + width / 2,
            y: pageY + height / 2,
          };
          // ITERATE THROUGH ALL SPACES THE PIECE COULD BE DROPPED
          for (const target of allTargets) {
            // GET THAT SPACE'S LAYOUT
            const {
              pageX: tx,
              pageY: ty,
              width: tWidth,
              height: tHeight,
            } = target.layout;

            // CHECK IF PIECE IS DROPPED ON THAT SPACE
            const isInside =
              pieceCenter.x >= tx &&
              pieceCenter.x <= tx + tWidth &&
              pieceCenter.y >= ty &&
              pieceCenter.y <= ty + tHeight;

            if (isInside) {
              // ADD OFFSET INTO THE BASE VALUE AND RESET OFFSET TO ZERO
              pan.flattenOffset();

              // IF THE SPACE IS A SLOT
              const isSlot = target.id in slots;
              if (isSlot) {
                const parts = target.id.split("-");
                if (parts.length !== 3) {
                  console.warn("Malformed slot ID:", target.id);
                  continue;
                }
                // GET THAT SLOT'S INFO FROM ITS ID
                const [orientation, rowStr, colStr] = parts;
                let row = parseInt(rowStr, 10);
                let col = parseInt(colStr, 10);

                // SET THE DIRECTION THE PIECE WILL GO
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

                let prevRow = null;
                let prevCol = null;

                while (true) {
                  if (
                    row < 0 ||
                    row >= BOARD_SIZE ||
                    col < 0 ||
                    col >= BOARD_SIZE
                  )
                    break;

                  // CHECK IF THE NEXT SPACE IS A VALID SPACE ON THE BOARD
                  const boardId = `${row}-${col}`;
                  const boardLayout = boardSpaces[boardId];

                  if (!boardLayout) break;
                  // CHECK IF NEXT SPACE IS OCCUPIED
                  const isOccupied =
                    boardPieceLocationsRef.current[boardId] !== undefined;

                  if (isOccupied) break;

                  prevRow = row;
                  prevCol = col;
                  // MOVE TO THE NEXT SPACE (NEVER REACHED IF SLOT IS BLOCKED)
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
                // IF SLOT IS BLOCKED, WARN
                if (prevRow === null || prevCol === null) {
                  console.warn("No free board space near slot:", target.id);
                  return;
                }
                // GET THE FINAL SPACE'S LAYOUT FROM THE BOARDSPACES OBJECT
                const finalBoardId = `${prevRow}-${prevCol}`;
                const finalBoardLayout = boardSpaces[finalBoardId];

                if (!finalBoardLayout) {
                  console.warn("No layout for final board space", finalBoardId);
                  return;
                }

                // Animate to slot...
                Animated.spring(pan, {
                  toValue: {
                    x: tx + tWidth / 2 - 16,
                    y: ty + tHeight / 2 - 16,
                  },
                  useNativeDriver: false,
                  speed: 1000,
                  bounciness: 0,
                  // ...then to final board space
                }).start(() => {
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
                    bounciness: 10,
                  }).start(() => {
                    currentWellIdRef.current = null;

                    // UPDATE THE PIECE'S LOCATION ON THE BOARD
                    setBoardPieceLocations((prev) => ({
                      ...prev,
                      [finalBoardId]: id,
                    }));
                  });
                });
              } else {
                // IF THE PIECE IS PLACED INSIDE A WELL SPACE
                // RESET THE WELL'S ID AND ANIMATE TO THE WELL SPACE
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
              } // .else{ if piece is not placed in a valid space, move it back to the well it came from}

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
