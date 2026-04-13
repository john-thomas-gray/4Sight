import { useGameContext } from "@/context/GameContext";

type RotateProps = { direction: "clockwise" | "counterclockwise" };

const useRotate = () => {
  const {} = useGameContext();

  const rotate = (props: RotateProps) => {};
};

export default useRotate;
