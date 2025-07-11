import React, { useEffect, useRef } from "react";
import { Image, View, ViewStyle } from "react-native";
import { icons } from "../constants";

type SlotSpaceProps = {
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

const SlotSpace = ({
  id,
  register,
  orientation,
  team = "white",
}: SlotSpaceProps) => {
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
    backgroundColor: "#6E2C00", // Deep reddish brown
    borderWidth: 2,
    borderColor: "#C0C0C0", // Silver border
    position: "relative", // Needed for absolutely positioned circle
  };

  return (
    <View ref={viewRef} style={style}>
      <View
        style={{
          position: "absolute",
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: "#C0C0C0", // Silver circle
          zIndex: 0,
        }}
      />
      <Image
        source={icons.slot[dir][team]}
        style={{
          width: 24,
          height: 24,
          resizeMode: "contain",
          zIndex: 1,
        }}
      />
    </View>
  );
};

export default SlotSpace;
