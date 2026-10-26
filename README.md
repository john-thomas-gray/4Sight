# 4Sight

4Sight is a Connect-Four-style board game with a twist: instead of pieces only “dropping down”, players can **shift gravity** to change how pieces settle, opening up new tactics for offense and defense.

Built with **Expo SDK (Software Development Kit) 57 + React Native 0.86**, using **`expo-router`** for navigation, **NativeWind (Tailwind)** for styling, **Reanimated + Gesture Handler** for interactions/animations, and **Jest** for tests.

## Requirements

- **Node.js**: version 24 LTS (Long-Term Support) recommended
- **npm**
- **iOS development (optional)**: Xcode 26.4 or newer, its Command Line Tools, and an installed simulator runtime; minimum deployment target is iOS 16.4
- **Android development (optional)**: Android Studio + an emulator/device

## Setup

Install dependencies:

```bash
npm install
```

For the checked-in Apple native project, install its dependencies after changing native packages:

```bash
cd ios
pod install
cd ..
```

## Run the app

Use VS Code (Visual Studio Code) as your editor and run these commands in its terminal. Apple builds still use Xcode's installed tools; you do not need to edit the project in Xcode. Expo 57 supports Xcode 27's Device Hub, which replaces the standalone Simulator app.

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
- **`engine/`**: game rules, board operations, gravity, and win detection
- **`session/`**: move scheduling and cancellation
- **`storage/`**: serialized persistence and saved-state validation
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

## Native project maintenance

The `ios/` and `android/` directories are checked in. Keep native settings synchronized with `app.json` manually and rebuild the development app after changing native dependencies. Expo Doctor warns about this workflow because changes to app configuration do not automatically update these directories. Expo 57 prebuild clears native directories by default, so review custom native changes before regenerating them.

Apple scene support is enabled in `expo-build-properties` and implemented in `AppDelegate.swift` and `Info.plist`, following [Expo's scene lifecycle migration](https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md). This is required for Xcode 27 builds. The main link scheme is `foursight`; native projects also retain `4sight` and register `exp+4sight` for the development client.

The Podfile includes a targeted RevenueCat color-initializer workaround for Xcode 27's Swift compiler. It moves the existing designated initializer into the struct to prevent a conflicting synthesized initializer. Remove it when the upstream RevenueCat implementation includes the fix.

The Podfile also updates Expo's Swift interface cleanup to handle Swift 6.4's `::` namespace spelling. This keeps the internal `CppError` conformance out of public interfaces so Expo modules can be imported with Xcode 27.1. Remove the workaround when Expo handles both namespace formats.
