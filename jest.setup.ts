jest.mock("react-native-reanimated", () => {
  const ReactNative = jest.requireActual("react-native");
  const React = jest.requireActual("react");
  const identity = (value: unknown) => value;
  const easing = {
    bounce: identity,
    cubic: identity,
    exp: identity,
    inOut: identity,
    linear: identity,
    out: identity,
    quad: identity,
  };

  const makeMutable = (initial: unknown) => {
    const shared = {
      value: initial,
      get: () => shared.value,
      set: (next: unknown) => { shared.value = typeof next === "function" ? next(shared.value) : next; },
    };
    return shared;
  };
  const reanimated = {
    Easing: easing,
    cancelAnimation: jest.fn(),
    createAnimatedComponent: (component: unknown) => component,
    makeMutable,
    runOnJS: (fn: unknown) => fn,
    useAnimatedStyle: (updater: () => unknown) => updater(),
    useDerivedValue: (updater: () => unknown) => ({ value: updater() }),
    useSharedValue: (value: unknown) => React.useState(() => makeMutable(value))[0],
    useAnimatedProps: (updater: () => unknown) => updater(),
    withDelay: jest.fn((_delayMs: number, animation: unknown) => animation),
    withRepeat: (animation: unknown) => animation,
    withSequence: (...animations: unknown[]) =>
      animations[animations.length - 1],
    withSpring: jest.fn((
      toValue: unknown,
      _config?: unknown,
      callback?: (finished: boolean) => void,
    ) => {
      callback?.(true);
      return toValue;
    }),
    withTiming: jest.fn((
      toValue: unknown,
      _config?: unknown,
      callback?: (finished: boolean) => void,
    ) => {
      callback?.(true);
      return toValue;
    }),
  };
  return {
    __esModule: true,
    ...reanimated,
    View: ReactNative.View,
    Text: ReactNative.Text,
    Image: ReactNative.Image,
    default: {
      ...reanimated,
      View: ReactNative.View,
      Text: ReactNative.Text,
      Image: ReactNative.Image,
      createAnimatedComponent: (component: unknown) => component,
    },
  };
});
