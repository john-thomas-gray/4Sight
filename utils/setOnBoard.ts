import { runOnJS } from "react-native-reanimated";

const setPieceOnBoard = (
  success: boolean,
  onBoardSV: { value: boolean },
  setOnBoard: (value: boolean) => void
) => {
  "worklet";
  if (success) {
    onBoardSV.value = true;
    runOnJS(setOnBoard)(true);
  }
};

export default setPieceOnBoard;
