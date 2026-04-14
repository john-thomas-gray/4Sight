import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Team } from "@/engine";

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
};

const UiContext = createContext<UiContextType | undefined>(undefined);

export const UiProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [moveInProgress, setMoveInProgress] = useState(false);
  const [gravityAnimating, setGravityAnimating] = useState(false);
  const [isPreviewingGravity, setIsPreviewingGravity] = useState(false);
  const [gravityPreviewBoard, setGravityPreviewBoard] = useState<
    Record<string, string> | null
  >(null);
  const [hoverPreview, setHoverPreview] = useState<{
    spaceId: string;
    team: Team;
  } | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setMoveInProgressDelayed = useCallback(
    (value: boolean, delayMs: number) => {
      if (delayRef.current) clearTimeout(delayRef.current);
      delayRef.current = setTimeout(() => {
        setMoveInProgress(value);
        delayRef.current = null;
      }, delayMs);
    },
    []
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
    }),
    [
      isGlobalLoading,
      moveInProgress,
      setMoveInProgressDelayed,
      gravityAnimating,
      isPreviewingGravity,
      gravityPreviewBoard,
      hoverPreview,
    ]
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
};

export const useUi = () => {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used within UiProvider");
  return ctx;
};
