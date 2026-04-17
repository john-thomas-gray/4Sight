import { Team } from "@/engine";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  cancelAnimation,
  Easing,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

type UiContextType = {
  isGlobalLoading: boolean;
  setIsGlobalLoading: React.Dispatch<React.SetStateAction<boolean>>;
  moveInProgress: boolean;
  setMoveInProgress: React.Dispatch<React.SetStateAction<boolean>>;
  setMoveInProgressDelayed: (value: boolean, delayMs: number) => void;
  gravityAnimating: boolean;
  setGravityAnimating: React.Dispatch<React.SetStateAction<boolean>>;
  isPreviewingGravity: boolean;
  setIsPreviewingGravity: React.Dispatch<React.SetStateAction<boolean>>;
  gravityPreviewBoard: Record<string, string> | null;
  setGravityPreviewBoard: React.Dispatch<
    React.SetStateAction<Record<string, string> | null>
  >;
  hoverPreview: { spaceId: string; team: Team } | null;
  setHoverPreview: React.Dispatch<
    React.SetStateAction<{ spaceId: string; team: Team } | null>
  >;
  /** Tutorial: true while dragging — rim opening pulses; on false, scale eases to 1 before stopping. */
  slotDropHintActive: boolean;
  setSlotDropHintActive: React.Dispatch<React.SetStateAction<boolean>>;
  slotRimOpeningScale: SharedValue<number>;
};

const UiContext = createContext<UiContextType | undefined>(undefined);

export const UiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [moveInProgress, setMoveInProgress] = useState(false);
  const [gravityAnimating, setGravityAnimating] = useState(false);
  const [isPreviewingGravity, setIsPreviewingGravity] = useState(false);
  const [gravityPreviewBoard, setGravityPreviewBoard] = useState<Record<
    string,
    string
  > | null>(null);
  const [hoverPreview, setHoverPreview] = useState<{
    spaceId: string;
    team: Team;
  } | null>(null);
  const [slotDropHintActive, setSlotDropHintActive] = useState(false);
  const slotRimOpeningScale = useSharedValue(1);
  const hadSlotPulseRef = useRef(false);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (slotDropHintActive) {
      cancelAnimation(slotRimOpeningScale);
      hadSlotPulseRef.current = true;
      slotRimOpeningScale.value = withRepeat(
        withSequence(
          withTiming(1.09, {
            duration: 700,
            easing: Easing.inOut(Easing.quad),
          }),
          withTiming(1, {
            duration: 700,
            easing: Easing.inOut(Easing.quad),
          }),
        ),
        -1,
        false,
      );
      return;
    }

    if (hadSlotPulseRef.current) {
      cancelAnimation(slotRimOpeningScale);
      hadSlotPulseRef.current = false;
      slotRimOpeningScale.value = withTiming(1, {
        duration: 550,
        easing: Easing.inOut(Easing.quad),
      });
      return;
    }

    cancelAnimation(slotRimOpeningScale);
    slotRimOpeningScale.value = 1;
  }, [slotDropHintActive, slotRimOpeningScale]);

  const setMoveInProgressDelayed = useCallback(
    (value: boolean, delayMs: number) => {
      if (delayRef.current) clearTimeout(delayRef.current);
      delayRef.current = setTimeout(() => {
        setMoveInProgress(value);
        delayRef.current = null;
      }, delayMs);
    },
    [],
  );

  React.useEffect(() => {
    return () => {
      if (delayRef.current) clearTimeout(delayRef.current);
    };
  }, []);

  const value = useMemo<UiContextType>(
    () => ({
      isGlobalLoading,
      setIsGlobalLoading,
      moveInProgress,
      setMoveInProgress,
      setMoveInProgressDelayed,
      gravityAnimating,
      setGravityAnimating,
      isPreviewingGravity,
      setIsPreviewingGravity,
      gravityPreviewBoard,
      setGravityPreviewBoard,
      hoverPreview,
      setHoverPreview,
      slotDropHintActive,
      setSlotDropHintActive,
      slotRimOpeningScale,
    }),
    [
      isGlobalLoading,
      moveInProgress,
      setMoveInProgressDelayed,
      gravityAnimating,
      isPreviewingGravity,
      gravityPreviewBoard,
      hoverPreview,
      slotDropHintActive,
      slotRimOpeningScale,
    ],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
};

export const useUi = () => {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used within UiProvider");
  return ctx;
};
