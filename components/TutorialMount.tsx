import { useTutorial } from "@/hooks/useTutorial";

export const TutorialMount = () => {
  const tutorial = useTutorial();
  return (
    <>
      {tutorial.overlay}
      {tutorial.modal}
    </>
  );
};
