import React, { useEffect, useRef } from "react";
import { Image, View, ViewStyle } from "react-native";
import { icons } from "../constants";

type SlotProps = {
  id: string;
  register: (
    id: string,
    layout: {
      pageX: number;
      pageY: number;
      width: number;
      height: number;
    },
    orientation: "N" | "S" | "E" | "W"
  ) => void;
  orientation: "N" | "S" | "E" | "W";
  team?: "black" | "white";
};

const Slot = ({ id, register, orientation, team = "white" }: SlotProps) => {
  const viewRef = useRef<View>(null);

  const reportLayout = () => {
    viewRef.current?.measure((x, y, width, height, pageX, pageY) => {
      register(id, { pageX, pageY, width, height }, orientation);
    });
  };

  useEffect(() => {
    const timer = setTimeout(reportLayout, 0);
    return () => clearTimeout(timer);
  }, []);

  const dirMap: Record<string, "up" | "down" | "right" | "left"> = {
    N: "down",
    S: "up",
    E: "left",
    W: "right",
  };

  const dir = dirMap[orientation];

  const style: ViewStyle = {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <View ref={viewRef} style={style}>
      <Image
        source={icons.slot[dir][team]}
        style={{ width: 40, height: 40, resizeMode: "contain" }}
      />
    </View>
  );
};

export default Slot;
