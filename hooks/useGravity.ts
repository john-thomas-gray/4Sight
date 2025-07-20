// hooks/useGravity.ts
import { useGameContext } from "@/context/GameContext";
import { Animated } from "react-native";

// Create this file to hold gravity logic
export const pieceAnimRefs: Record<string, Animated.ValueXY> = {};

const toRowCol = (id: string) => {
  const [r, c] = id.split("-").map(Number);
  return { row: r, col: c };
};

const toId = (row: number, col: number) => `${row}-${col}`;

export const useGravity = () => {
  const { boardPieceLocations, setBoardPieceLocations, boardSpaces } =
    useGameContext();

  const applyGravity = (direction: "up" | "down" | "left" | "right") => {
    const BOARD_SIZE = 9;
    const occupied = new Set(Object.keys(boardPieceLocations));

    const pieces = Object.entries(boardPieceLocations).map(([id, team]) => {
      const { row, col } = toRowCol(id);
      return { id, row, col, team };
    });

    pieces.sort((a, b) => {
      if (direction === "left") return a.col - b.col;
      if (direction === "right") return b.col - a.col;
      if (direction === "up") return a.row - b.row;
      return b.row - a.row;
    });

    const newPositions: Record<string, string> = {};

    pieces.forEach(({ id, row, col }) => {
      occupied.delete(id);
      let r = row;
      let c = col;

      while (true) {
        let nextR = r;
        let nextC = c;
        if (direction === "left") nextC--;
        if (direction === "right") nextC++;
        if (direction === "up") nextR--;
        if (direction === "down") nextR++;
        if (
          nextR < 0 ||
          nextC < 0 ||
          nextR >= BOARD_SIZE ||
          nextC >= BOARD_SIZE
        )
          break;

        const nextId = toId(nextR, nextC);
        if (occupied.has(nextId)) break;
        r = nextR;
        c = nextC;
      }

      const finalId = toId(r, c);
      newPositions[id] = finalId;
      occupied.add(finalId);
    });

    const animations = pieces.map(({ id }) => {
      const fromId = id;
      const toId = newPositions[id];
      if (fromId === toId) return Animated.delay(0);
      const fromLayout = boardSpaces[fromId];
      const toLayout = boardSpaces[toId];
      if (!fromLayout || !toLayout) return Animated.delay(0);

      const dx = toLayout.pageX - fromLayout.pageX;
      const dy = toLayout.pageY - fromLayout.pageY;

      return Animated.timing(pieceAnimRefs[id], {
        toValue: { x: dx, y: dy },
        duration: 300,
        useNativeDriver: true,
      });
    });

    Animated.stagger(50, animations).start(() => {
      const updated: Record<string, "white" | "black"> = {};
      pieces.forEach(({ id, team }) => {
        const newId = newPositions[id];
        updated[newId] = team;
        pieceAnimRefs[id]?.setValue({ x: 0, y: 0 });
      });
      setBoardPieceLocations(updated);
    });
  };

  return applyGravity;
};
