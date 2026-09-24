import React, { createContext, useCallback, useContext, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(key => Object.prototype.hasOwnProperty.call(b, key) && Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
}

/** Stable subscriptions let consumers select only the values they render. */
export function createSelectorContext<T>(name: string) {
  type Store = {
    get: () => T;
    subscribe: (listener: () => void) => () => void;
    publish: (value: T) => void;
  };
  const Context = createContext<Store | null>(null);
  function Provider({
    value,
    children
  }: {
    value: T;
    children: React.ReactNode;
  }) {
    const [store] = useState<Store>(() => {
      let snapshot = value;
      const listeners = new Set<() => void>();
      return {
        get: () => snapshot,
        subscribe: listener => {
          listeners.add(listener);
          return () => {
            listeners.delete(listener);
          };
        },
        publish: next => {
          if (Object.is(snapshot, next)) return;
          snapshot = next;
          listeners.forEach(listener => listener());
        }
      };
    });
    useLayoutEffect(() => {
      store.publish(value);
    }, [store, value]);
    return <Context.Provider value={store}>{children}</Context.Provider>;
  }
  function useSelector<S>(selector: (value: T) => S): S {
    const store = useContext(Context);
    if (!store) throw new Error(`${name} must be used within its provider`);
    const cache = useRef<{
      selected: S;
    } | null>(null);
    const getSnapshot = useCallback(() => {
      const selected = selector(store.get());
      if (cache.current && shallowEqual(cache.current.selected, selected)) return cache.current.selected;
      cache.current = {
        selected
      };
      return selected;
    }, [store, selector]);
    return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
  }
  return {
    Provider,
    useSelector
  };
}
