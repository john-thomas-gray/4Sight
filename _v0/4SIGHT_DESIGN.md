## System Design Template

### 1. Requirements
- Functional requirements
  - Run the 4Sight puzzle game on iOS/Android with touch interactions.
  - Render board, pieces, animations, and game state UI.
  - Persist and restore local game progress and settings.
  - Provide how-to-play and settings screens.
- Non-functional requirements
  - Smooth animations and responsive touch handling.
  - Offline-first; no network dependency for core gameplay.
  - Fast cold start and minimal memory use on mobile devices.
- Out of scope
  - Multiplayer, online leaderboards, or cloud save.
  - Server-side authoritative game logic.

### 2. Back-of-the-envelope estimations
- Daily active users and read/write mix
  - 100% local reads/writes; no backend traffic.
  - Reads: render/game state; Writes: local save on move/setting change.
- Storage growth (1 year or active period)
  - Local state and settings only; <1 MB per device.
- Network usage (RPS, bandwidth, peak)
  - None for core gameplay.

### 3. API design and data representation
- Core entities and fields
  - GameState: board slots, pieces, turn, highlights, win state.
  - Settings: theme, accessibility toggles, animation speed.
  - Tutorial state: seen steps, current step.
- External API surface (REST/gRPC/GraphQL)
  - None required.
- Pagination, rate limits, auth
  - Not applicable.

### 4. High-level design
- Services and components
  - React Native (Expo) app with screens in `app/`.
  - UI components in `components/` (Board, Piece, Slot, etc.).
  - Game logic and utilities in `utils/` and `hooks/`.
  - Context providers in `context/` for game/layout/settings state.
- Request flows
  - App start -> load saved game/settings -> render board.
  - Player gesture -> update game state -> animate -> persist locally.
- External integrations
  - Local storage via AsyncStorage (wrapped in `utils/useAsyncStorage.ts`).

### 5. Database design
- Primary schema (tables/collections)
  - Local key-value entries:
    - `gameState`: serialized GameState.
    - `settings`: serialized Settings.
    - `tutorialState`: serialized tutorial progress.
- Replication, sharding, backups
  - None.
- Object storage (if needed)
  - Not needed.

### 6. Detailed design choices
- Caching, CDN, queues
  - In-memory state via React context; no CDN/queues.
- Consistency trade-offs
  - Local state is source of truth; last-write-wins on save.
- Security, privacy, auth
  - No PII; local-only storage; no auth.
- Failure handling and observability
  - Guarded storage reads; fallback to default state on error.
