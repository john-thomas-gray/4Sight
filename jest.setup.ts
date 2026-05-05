jest.mock("react-native-reanimated", () => {
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

  return {
    Easing: easing,
    cancelAnimation: jest.fn(),
    makeMutable: (value: unknown) => ({ value }),
    runOnJS: (fn: unknown) => fn,
    useAnimatedStyle: (updater: () => unknown) => updater(),
    useDerivedValue: (updater: () => unknown) => ({ value: updater() }),
    useSharedValue: (value: unknown) => ({ value }),
    withDelay: (_delayMs: number, animation: unknown) => animation,
    withRepeat: (animation: unknown) => animation,
    withSequence: (...animations: unknown[]) =>
      animations[animations.length - 1],
    withTiming: (
      toValue: unknown,
      _config?: unknown,
      callback?: (finished: boolean) => void,
    ) => {
      callback?.(true);
      return toValue;
    },
  };
});
