# System design

4Sight is a two-team board game with four-direction gravity. Expo Router owns navigation; the engine owns game rules; session commands own move transactions; Reanimated owns motion.

## Rules and session ownership

`engine/` contains immutable board operations, placement validation, gravity resolution, and win detection. Placement rejects pieces already on the board and invalid coordinates.

`GameSessionContext` keeps the board, well membership, and piece status in one session snapshot. `dropPiece` updates all three atomically. Commands read the latest snapshot even when several commands run before React renders again. Presentation code uses `beginPieceDrag` and `returnPieceToWell` instead of directly changing maps.

`session/moveCoordinator.ts` admits one piece, gravity, or reset operation at a time. It owns delayed commits and cancellation. New games, restored games, scenario changes, and gameplay unmounts cancel old timers and active gestures. Cancelled waits resolve rather than leaving reset promises pending. Interrupted pieces return to their wells; board pieces return to authoritative board coordinates.

## Rendering and interaction

The session, layout, and user interface providers expose selective subscriptions through `context/selectorContext.tsx`. Piece consumers select their own status and well, board spaces select their highlight, and registration-only consumers select the stable registration function. Full-session subscriptions remain available for screen orchestration.

`LayoutContext` batches measurements per animation frame, ignores identical geometry, and computes hit-test cells and board lighting once. `PlayfieldFrameContext` publishes the board's window origin to shared animation values.

`PieceView` renders the piece and its visual effects. `usePieceGesture` owns pickup, hover targets, release, and cancellation. Continuous pointer motion runs in animation worklets; only lifecycle events and changed preview targets cross to JavaScript. Preview and final placement use the same drop resolver. Disabling placement previews leaves motion enabled.

`usePlayfieldAnimations` handles entrance, initial placement, and changed geometry. Ordinary turns do not reset every piece's position or overwrite a winning animation. `useTutorialReplies` handles scripted opposing moves, while `useGamePlayTutorial` controls lesson progression. Completing the tutorial persists its completion flag before starting the next game.

## Persistence

`storage/storage.ts` serializes updates to the versioned application record. Reads wait for queued writes. Settings changes, session saves, clears, and tutorial completion therefore cannot overwrite each other's fields. Write failures are reported and do not block later writes.

`storage/validation.ts` validates nested domain data, enum values, coordinates, piece identity, and uniqueness. It rejects invalid game data while retaining valid settings. It repairs well membership and reconstructs transient piece status from the board so held pieces are not restored as unfinished drags. Saves occur after committed turns or settled well rearrangements; transient held state is skipped.

## Commerce

Commerce still defaults to the in-memory mock adapter. Production adapter configuration and ownership reconciliation are tracked in GitHub issue #5: https://github.com/john-thomas-gray/4Sight/issues/5.

## Verification

Jest covers engine invariants, storage concurrency and recovery, session cancellation, selective subscriptions, layout batching, gesture previews and release, and tutorial progression. Animation mocks preserve shared-value identity and support both property access and getter/setter methods. Browser and native bundle checks complement tests; device profiling is still needed to measure frame pacing.
