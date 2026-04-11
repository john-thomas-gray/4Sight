# System Design

## Overview
4Sight is a Connect-Four-style game with gravity shifting. The app is built with Expo + React Native using `expo-router` for navigation. Game state, layout data, and settings are managed via React contexts and hooks, while animations and gestures are handled with Reanimated and Gesture Handler.

## Architecture
- **UI layer**: Screens in `app/` and components in `components/` compose the board, pieces, overlays, and menus.
- **State layer**: Context providers in `context/` manage:
  - Layout registry (`LayoutContext`) for measured slot/space/well positions.
  - Game logic + board state (`LogicContext`) split into UI, game flow, board state, animations, and interactions sub-contexts.
  - Settings + persistence (`SettingsContext`) for theme and feature toggles.
- **Logic/utility layer**: Game rules, win detection, and board operations live in `utils/` and `constants/`.
- **Animations**: Timing and shared values are centralized in `constants/animations.ts` and `animations/`.

## Key data flows
- **Layout registration**: Cell components register their measured layouts into `LayoutContext`, which flags `layoutReady` once the board is fully measured.
- **Game setup**: When layout is ready, `LogicContext` builds the initial pieces and well locations, then sets `GameState.Ready`.
- **Turn progression**: Piece placement updates `boardPieceLocations` and triggers win detection. `findPieceRelationships()` computes winners and next-turn threats, and the game advances or finishes accordingly.
- **Reset flow**: `resetGame()` animates pieces back to wells and then rehydrates a fresh game state.

## State and persistence
- **In-memory state**: `LogicContext` holds the live board state, turn data, and animation flags.
- **Persistence**: `SettingsContext` saves settings and game snapshots via AsyncStorage (see `utils/useAsyncStorage`), restoring on app launch.

## Rendering and interaction
- The `gamePlay` screen renders the board, wells, pieces, and overlays.
- Pieces are animated via shared Reanimated values stored per piece ID.
- Gesture handling (e.g., drops, shifts) is coordinated through hooks in `hooks/` and component handlers.

## Testing
- Jest tests live under `__tests__/` with mocks in `__mocks__/`.
