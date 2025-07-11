import React, { useEffect, useRef } from "react";
import { View, ViewStyle } from "react-native";

type WellSpaceProps = {
  backgroundColor?: string;
  id: string;
  register: (
    id: string,
    layout: {
      pageX: number;
      pageY: number;
      width: number;
      height: number;
    }
  ) => void;
};

const WellSpace = ({
  id,
  register,
  backgroundColor = "#065f46",
}: WellSpaceProps) => {
  const viewRef = useRef<View>(null);

  const reportLayout = () => {
    viewRef.current?.measure((x, y, width, height, pageX, pageY) => {
      register(id, { pageX, pageY, width, height });
    });
  };

  useEffect(() => {
    const timer = setTimeout(reportLayout, 0);
    return () => clearTimeout(timer);
  }, []);

  const style: ViewStyle = {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 1,
    backgroundColor,
    borderWidth: 1,
    borderColor: "silver",
  };

  return <View ref={viewRef} onLayout={reportLayout} style={style} />;
};

export default WellSpace;
