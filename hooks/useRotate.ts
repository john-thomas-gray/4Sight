import { useMegaContext } from "@/context/MegaContext";

type RotateProps = { direction: "clockwise" | "counterclockwise" };

const useRotate = () => {
  const {} = useMegaContext();

  const rotate = (props: RotateProps) => {};
};

export default useRotate;
