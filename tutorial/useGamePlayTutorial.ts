import type { PieceStatusMap } from "@/types/pieceStatus";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { resolveGamePlayTutorialStep } from "./gamePlayTutorialSteps";

type Args = {
  scenarioParam: string | undefined;
  tutorialStepParam: string | undefined;
  pieceStatusMap: PieceStatusMap;
  setSlotDropHintActive: (active: boolean) => void;
};

/**
 * Wires tutorial steps defined in {@link ./gamePlayTutorialSteps} to game session + UI.
 * Screen stays responsible only for rendering the banner from returned flags.
 */
export function useGamePlayTutorial({
  scenarioParam,
  tutorialStepParam,
  pieceStatusMap,
  setSlotDropHintActive,
}: Args) {
  const router = useRouter();
  const activeStep = useMemo(
    () => resolveGamePlayTutorialStep(scenarioParam, tutorialStepParam),
    [scenarioParam, tutorialStepParam],
  );

  const completionStartedRef = useRef(false);

  useEffect(() => {
    completionStartedRef.current = false;
  }, [activeStep?.id]);

  useEffect(() => {
    if (!activeStep) return;
    if (completionStartedRef.current) return;
    if (!activeStep.isComplete(pieceStatusMap)) return;
    completionStartedRef.current = true;
    void activeStep.runOnComplete(router);
  }, [activeStep, pieceStatusMap, router]);

  useEffect(() => {
    if (!activeStep) {
      setSlotDropHintActive(false);
      return;
    }
    const pulse = activeStep.slotDropHintActive(pieceStatusMap);
    setSlotDropHintActive(pulse);
    return () => setSlotDropHintActive(false);
  }, [activeStep, pieceStatusMap, setSlotDropHintActive]);

  const showBanner =
    !!activeStep && activeStep.showBanner(pieceStatusMap);
  const bannerMessage = activeStep?.bannerMessage ?? "";

  return { showBanner, bannerMessage };
}
