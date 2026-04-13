# 4Sight Rewrite Blueprint

## 1) Current Feature Inventory (What Exists Today)

### Core gameplay

- 7x7 Connect-Four-style board with four-direction gravity shift mechanic.
- Turn-based play with two teams (`TeamOne`, `TeamTwo`) and win detection for rows/columns/diagonals.
- Piece drag-and-drop interactions from wells to board, with blocked/misplaced handling and return-to-well behaviors.
- Gravity shift by board fling gestures (`up`, `down`, `left`, `right`) with animated repositioning.
- "Next turn winning move" detection and highlight support.
- Winner state handling with winner piece animation and win overlay.
- Reset game flow, including animated return of placed pieces to wells.

### UI and navigation

- Main menu screen with New Game/Tutorial label, Continue button (when save exists), and Settings entry.
- Gameplay screen with board, wells, overlays, loading states, and menu button.
- Settings screen with theme and gameplay toggles.
- Global loading overlay and in-screen loading presentation.

### Themes and visual customization

- Theme system with at least two built-in themes (`Classic`, `Schoolhouse`).
- Theme-driven colors and text labels (team names/colors, board colors, etc.).
- Piece visual polish (glow, sheen, color changes for winner state).

### Player-assist and accessibility-adjacent behavior

- Toggleable gravity shift previews.
- Toggleable piece drop previews.
- Toggleable winning-move highlights.
- Shake-to-reset support (device accelerometer).

### Persistence and app state

- Local persistence via AsyncStorage for:
  - Theme and gameplay settings toggles.
  - In-progress game state (pieces, turn, winner, board/well mappings).
- Continue game flow from saved state.
- Saved-game detection for menu Continue visibility.

### Engineering/tooling baseline

- Expo + React Native + expo-router app structure.
- Reanimated + Gesture Handler + worklets-based animation/interaction stack.
- Jest test suite exists for selected components/utils/screens.
- iOS and Android native projects present (`expo run:ios`, `expo run:android` workflow).

### Partial/unfinished or inconsistent features present in codebase

- `GameMode.FourPlayer` exists in types/content but gameplay behavior appears primarily two-team oriented.
- Tutorial toggle exists, but there is no complete interactive tutorial flow implementation.
- `react-native-purchases` dependency is installed, but no complete in-app purchase/theme storefront flow is wired in-app.

---

## 2) Sloppy / Risky Design Areas To Avoid In The Rewrite

### Monolithic component architecture

- `components/Piece.tsx` is very large and mixes gesture handling, board rules, animation orchestration, preview UI, and state mutation in one component.
- `components/Board.tsx` also combines rendering, gesture routing, gravity preview simulation, and move orchestration.
- Result: hard to reason about, hard to test, and high regression risk.

### Duplicated game-rule logic

- Gravity simulation logic is duplicated between `hooks/useGravity.ts` and preview logic in `components/Board.tsx`.
- Similar board movement/path logic is spread across multiple files rather than one authoritative rules engine.
- Result: behavior drift and subtle bugs when one implementation changes and others do not.

### State ownership is overly coupled

- `context/LogicContext.tsx` has very broad responsibilities: game flow, board state, UI loading, animation coordination, persistence coupling, and timers.
- `context/SettingsContext.tsx` also owns game persistence side-effects, mixing settings concerns with game snapshot writes.
- Result: hidden coupling, many side effects, difficult debugging, and fragile lifecycle behavior.

### Timer/worklet lifecycle complexity

- Multiple timeout refs and delayed state flips exist across gameplay, board, piece, and animation modules.
- Some timeout registries are module-level maps (for example in `animations/pieceAnimations.ts`) and not centrally lifecycle-managed.
- Result: memory leak risk, stale callback risk, and inconsistent state after rapid screen transitions/resets.

### Layout-driven logic initialization

- Gameplay setup depends on measured runtime layout registration for board cells before pieces can be initialized.
- This introduces sequencing complexity and additional edge cases around rehydration/reset.
- Result: race conditions and brittle startup behavior.

### Data model is too UI-centric

- Board locations are heavily represented as string IDs (`"row-col"`) and manipulated in many places.
- Domain rules and UI coordinates are interwoven too early.
- Result: more parsing/transform noise, harder pure logic testing, and harder future expansion (AI, multiplayer, analytics).

### Missing production architecture for monetization

- Purchasable theme objective is not represented by robust domain entities (catalog, entitlement, restore flow, fallback behavior).
- No clear separation between local theme config and paid content state.
- Result: release risk for App Store / Play Store IAP compliance and poor maintainability.

### Incomplete feature flags / dead-end paths

- Tutorial and four-player mode have partial traces in code and docs but no complete, reliable behavior.
- Result: product ambiguity and unclear scope boundaries.

### Debug noise and inconsistent quality gates

- Console logging exists in gameplay-critical paths.
- Existing tests cover slices, but not enough integration-level coverage for full move/shift/reset lifecycle.
- Result: hard to guarantee stability for marketplace release.

---

## 3) Rewrite Design Document Outline (Professional, Release-Oriented)

## A. Product Scope and Success Criteria

- Define v1 release scope explicitly: two-player gravity-shift mode first, then optional four-player as post-v1.
- Define acceptance criteria for launch: crash-free session target, frame-time target, save integrity, and gesture reliability.
- Define monetization goals: paid theme packs and restore purchases across reinstall/device migration where platform allows.

## B. Domain Model (Source of Truth)

- Create a pure game engine module with no React Native dependencies:
  - Board representation (typed coordinates, not ad-hoc strings in core logic).
  - Move validation and resolution.
  - Gravity shift resolution.
  - Win/near-win detection.
  - Turn progression and game end rules.
- Engine API returns immutable next-state + events (for animations/UI to consume).

## C. State Architecture

- Split app state into clear slices:
  - `GameSessionState` (board, turn, result).
  - `UiState` (loading, overlays, drag state).
  - `SettingsState` (theme, preview toggles, accessibility toggles).
  - `CommerceState` (products, entitlements, purchase status).
- Keep persistence orchestration in dedicated storage services, not in presentation components.

## D. UI Component Architecture

- Break `Piece` into focused modules:
  - `PieceView` (render only),
  - `usePieceGesture` (input handling),
  - `usePieceAnimation` (motion orchestration),
  - `pieceDropController` (delegates to engine + state updates).
- Break `Board` into:
  - `BoardGridView`,
  - `GravityGestureLayer`,
  - `GravityPreviewLayer`,
  - `BoardCoordinator`.
- Keep components mostly declarative; isolate imperative animation/worklet code in dedicated hooks/services.

## E. Animation and Gesture System

- Define animation state machine for piece lifecycle: `inWell -> held -> dropping -> onBoard -> resetting`.
- Use one gravity simulation function shared by both execution and preview.
- Centralize cancellation/cleanup policy for animations and timers during unmount/reset/navigation.

## F. Persistence and Recovery

- Version persisted schema (`appStateVersion`) and add migration handling.
- Persist only serializable domain state + minimal UI flags.
- Implement safe load flow with validation and fallback defaults.
- Add corruption guardrails (invalid payload handling, partial recovery strategy).

## G. Monetization and Theme Commerce

- Add commerce module with clear interfaces:
  - Product catalog fetch,
  - Purchase flow,
  - Entitlement cache,
  - Restore purchases.
- Theme model: `free`, `owned`, `locked`, `featured`.
- Settings UI reads entitlements, not hardcoded theme availability.
- Add graceful offline behavior and purchase-state reconciliation.

## H. Testing Strategy

- Unit tests for pure game engine (all move/shift/win combinations and edge cases).
- Deterministic scenario tests for reset/continue/save flows.
- Integration tests for gesture -> engine -> animation intent -> state update sequence.
- Smoke tests for theme switching and purchase entitlement gating.

## I. Performance and Memory Strategy

- Define budgets for startup time, memory, and frame pacing.
- Avoid repeated object churn in hot paths.
- Audit and own all timers/subscriptions with explicit cleanup ownership.
- Add profiling checkpoints before release candidates.

## J. Release Readiness and Store Compliance

- Add crash/error reporting and analytics events for critical funnels (new game, continue, purchase, restore).
- Create QA checklist for iOS/Android parity and device matrix.
- Prepare store metadata assets and policy compliance items (IAP disclosures, privacy, restore path).

## K. Recommended Build Order (Small, Safe Milestones)

1. Build and test pure game engine package.
2. Rebuild board + piece interaction layer on top of engine API.
3. Reintroduce persistence with versioned schema.
4. Reintroduce theming + settings toggles.
5. Integrate purchases + locked/unlocked theme UX.
6. Harden with integration/performance testing and release checklist.
