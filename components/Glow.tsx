import { useLogicBoardState } from "@/context/LogicContext";
import { PieceStatus } from "@/types/logic";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

interface GlowProps {
  pieceId: string;
}

const Glow: React.FC<GlowProps> = ({ pieceId }) => {
  const { pieceStatusMap } = useLogicBoardState();
  const pieceStatus = pieceStatusMap[pieceId];
  const [style, setStyle] = useState(styles.off);

  useEffect(() => {
    if (pieceStatus === PieceStatus.winner) {
      setStyle(styles.winner);
      return;
    } else if (pieceStatus === PieceStatus.partial) {
      setStyle(styles.partial);
    } else {
      setStyle(styles.off);
    }
  }, [pieceStatus]);

  return <View style={style} />;
};

export default Glow;

const styles = StyleSheet.create({
  off: {
    height: 0,
    width: 0,
    borderRadius: 30,
    backgroundColor: "rgba(255, 217, 0, 0.1)",
    position: "absolute",
    shadowColor: "rgba(255, 217, 0, 0.9)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
    elevation: 10,
  },
  partial: {
    height: 60,
    width: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    position: "absolute",
    shadowColor: "rgba(255, 0, 0, 0.9)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
    elevation: 10,
  },
  winner: {
    height: 60,
    width: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 217, 0, 0.1)",
    position: "absolute",
    shadowColor: "rgba(255, 217, 0, 0.9)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
    elevation: 10,
  },
});
