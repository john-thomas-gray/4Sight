export type MoveCoordinator = ReturnType<typeof createMoveCoordinator>;

/** Every delayed mutation belongs to the current session generation. */
export function createMoveCoordinator() {
  let generation = 0;
  let phase: "piece" | "gravity" | "reset" | null = null;
  const pending = new Map<ReturnType<typeof setTimeout>, () => void>();
  const listeners = new Set<() => void>();
  const schedule = (callback: () => void, delayMs: number, onCancel = () => {}) => {
    const scheduledGeneration = generation;
    const timer = setTimeout(() => {
      pending.delete(timer);
      if (generation === scheduledGeneration) callback();
    }, delayMs);
    pending.set(timer, onCancel);
    return () => {
      if (!pending.delete(timer)) return;
      clearTimeout(timer);
      onCancel();
    };
  };
  return {
    schedule,
    getPhase: () => phase,
    begin: (next: NonNullable<typeof phase>) => {
      if (phase !== null) return false;
      phase = next;
      return true;
    },
    finish: () => {
      phase = null;
    },
    onCancel: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    wait: (delayMs: number) => new Promise<boolean>(resolve => {
      schedule(() => resolve(true), delayMs, () => resolve(false));
    }),
    cancelAll: () => {
      generation++;
      phase = null;
      const cancelled = [...pending];
      pending.clear();
      for (const [timer, onCancel] of cancelled) {
        clearTimeout(timer);
        onCancel();
      }
      listeners.forEach(listener => listener());
    }
  };
}
