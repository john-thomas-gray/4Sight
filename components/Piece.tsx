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
  currentWellId?: string;
};

const Piece = ({
  team = "white",
  initialPosition = { x: 0, y: 0 },
  wellSpaces,
  currentWellId,
}: PieceProps) => {
  const pan = useRef(new Animated.ValueXY(initialPosition)).current;
  const [isDragging, setIsDragging] = useState(false);
  const pieceRef = useRef<View>(null);
  const { wellPieceLocations, setWellPieceLocations } = useGameContext();

  const currentWellIdRef = useRef<string | null>(currentWellId ?? null);
  const wellPieceLocationsRef = useRef(wellPieceLocations);

  useEffect(() => {
    wellPieceLocationsRef.current = wellPieceLocations;
  }, [wellPieceLocations]);

  useEffect(() => {
    pan.setValue(initialPosition);

    if (currentWellId) {
      setWellPieceLocations((prev) => ({
        ...prev,
        [currentWellId]: team,
      }));
    }
  }, []);

  useEffect(() => {
    console.log("📦 wellPieceLocations updated:", wellPieceLocations);
  }, [wellPieceLocations]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        setIsDragging(true);

        console.log("currentWellId,", currentWellIdRef.current);
        if (currentWellIdRef.current) {
          setWellPieceLocations((prev) => {
            const updated = { ...prev };
            console.log(updated[currentWellIdRef.current as string]);
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

          for (const well of wellSpaces) {
            const {
              pageX: wx,
              pageY: wy,
              width: wWidth,
              height: wHeight,
            } = well.layout;

            const isInside =
              pieceCenter.x >= wx &&
              pieceCenter.x <= wx + wWidth &&
              pieceCenter.y >= wy &&
              pieceCenter.y <= wy + wHeight;

            if (isInside) {
              console.log("✅ Dropped inside:", well.id);

              pan.flattenOffset();

              setWellPieceLocations((prev) => ({
                ...prev,
                [well.id]: team,
              }));

              currentWellIdRef.current = well.id;

              Animated.spring(pan, {
                toValue: {
                  x: wx + wWidth / 2 - 16,
                  y: wy + wHeight / 2 - 16,
                },
                useNativeDriver: false,
              }).start();

              return;
            }
          }

          console.log("❌ Dropped outside any well");
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
