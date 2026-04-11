import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

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
};

const UiContext = createContext<UiContextType | undefined>(undefined);

export const UiProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [moveInProgress, setMoveInProgress] = useState(false);
  const [gravityAnimating, setGravityAnimating] = useState(false);
  const [isPreviewingGravity, setIsPreviewingGravity] = useState(false);
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
    }),
    [
      isGlobalLoading,
      moveInProgress,
      setMoveInProgressDelayed,
      gravityAnimating,
      isPreviewingGravity,
    ]
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
};

export const useUi = () => {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used within UiProvider");
  return ctx;
};
