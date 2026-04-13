import React from "react";

type AnyFunction = (...args: any[]) => void;

/**
 * Returns a debounced press handler that ignores subsequent presses for `delayMs`.
 * Ensures the latest callback is invoked and prevents rapid double-taps.
 */
export function useDebouncedPress<T extends AnyFunction>(
  callback: T,
  delayMs: number = 500
): T {
  const callbackRef = React.useRef<T>(callback);
  const isCoolingDownRef = React.useRef(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return React.useCallback(
    ((...args: any[]) => {
      if (isCoolingDownRef.current) return;
      isCoolingDownRef.current = true;
      try {
        callbackRef.current(...args);
      } finally {
        timeoutRef.current = setTimeout(() => {
          isCoolingDownRef.current = false;
        }, delayMs);
      }
    }) as T,
    [delayMs]
  );
}

export default useDebouncedPress;
