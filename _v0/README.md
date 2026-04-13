# 4Sight

4Sight is a Connect-Four-style board game with a twist: instead of pieces only “dropping down”, players can **shift gravity** to change how pieces settle, opening up new tactics for offense and defense.

Built with **Expo + React Native**, using **`expo-router`** for navigation, **NativeWind (Tailwind)** for styling, **Reanimated + Gesture Handler** for interactions/animations, and **Jest** for tests.

## Requirements

- **Node.js**: current LTS recommended
- **npm**
- **iOS development (optional)**: Xcode + Command Line Tools
- **Android development (optional)**: Android Studio + an emulator/device

## Setup

Install dependencies:

```bash
npm install
```

## Run the app

Start the Metro dev server:

```bash
npm start
```

Then choose a target:

- **Web**:

```bash
npm run web
```

- **iOS (dev build)**:

```bash
npm run ios
```

- **Android (dev build)**:

```bash
npm run android
```

### Expo Go vs dev builds

This project includes native modules (for example `react-native-purchases`), so **Expo Go may not be sufficient** depending on what codepaths you hit.

- If you see “native module not found / not available in Expo Go”-style errors, use a **development build** via `npm run ios` / `npm run android`.
- If everything you’re working on is supported in Expo Go, `npm start` + “Open in Expo Go” can still be convenient.

## Test & lint

- **Run tests**:

```bash
npm test
```

- **Run lint**:

```bash
npm run lint
```

## Project structure (high level)

- **`app/`**: screens/routes (file-based routing via `expo-router`)
- **`components/`**: UI components (board, pieces, overlays, etc.)
- **`context/`**: global state providers (game state, logic, layout, settings)
- **`utils/`**: game logic + helpers (board updates, reachable slots, persistence, etc.)
- **`constants/`**: game constants, themes, animation timings
- **`__tests__/`** and **`__mocks__/`**: Jest tests and mocks

Imports use the `@/` alias (configured in `tsconfig.json`).

## Troubleshooting

- **Metro is acting weird**: try clearing the cache

```bash
npx expo start --clear
```

- **iOS build issues**: confirm Xcode is installed and you’ve opened/accepted licenses at least once.
- **Android build issues**: confirm Android Studio SDKs are installed and an emulator/device is available.
