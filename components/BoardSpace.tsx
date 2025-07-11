import { useEffect, useRef } from "react";
import { View, ViewStyle } from "react-native";

type BoardSpaceProps = {
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

const BoardSpace = ({ id, register }: BoardSpaceProps) => {
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

  const [rowStr, colStr] = id.split("-");
  const row = parseInt(rowStr, 10);
  const col = parseInt(colStr, 10);
  const isEven = (row + col) % 2 === 0;

  const style: ViewStyle = {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 1,
    backgroundColor: isEven ? "#d1fae5" : "#ffffff",
    borderWidth: 1,
    borderColor: "#ccc",
  };

  return <View ref={viewRef} onLayout={reportLayout} style={style} />;
};

export default BoardSpace;
