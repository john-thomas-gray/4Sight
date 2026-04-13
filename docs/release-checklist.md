# 4Sight Release Checklist

## Pre-Release Testing

### Engine Integrity
- [ ] All engine unit tests pass (`npx jest engine/__tests__`)
- [ ] Edge cases: full board gravity, 5+ in-a-row, both-team simultaneous wins
- [ ] Near-win detection: blocked cells excluded, multi-direction detection
- [ ] Game flow: turn alternation, gravity after placement, no-op gravity

### Persistence
- [ ] All storage tests pass (`npx jest storage/__tests__`)
- [ ] New game -> play -> background app -> reopen -> state preserved
- [ ] Continue from menu restores board, pieces, turn, and piece positions
- [ ] Reset game clears session but preserves settings
- [ ] Corrupt storage data handled gracefully (no crash, falls back to defaults)
- [ ] Schema migration path tested (for future version bumps)

### Commerce & Entitlements
- [ ] All commerce tests pass (`npx jest commerce/__tests__`)
- [ ] Free themes selectable without purchase
- [ ] Locked themes show price and trigger purchase flow
- [ ] Successful purchase unlocks theme and auto-selects it
- [ ] Cancelled purchase returns to settings without side effects
- [ ] Restore Purchases recovers previously purchased themes
- [ ] Offline behavior: app launches normally, locked themes stay locked
- [ ] RevenueCat API key configured for production

### Theming
- [ ] Theme switching updates all UI elements immediately
- [ ] Piece colors update when theme changes mid-game
- [ ] Win overlay uses correct team names and colors per theme
- [ ] Settings screen is fully themed (background, text, cards, toggles)
- [ ] Persisted theme ID survives app restart

### Gameplay
- [ ] Piece drag-and-drop from well to slot
- [ ] Piece slides through slot to landing position
- [ ] Blocked slot returns piece to well with animation
- [ ] Gravity fling in all 4 directions
- [ ] Win detection after piece placement
- [ ] Win detection after gravity shift
- [ ] Win overlay appears and auto-dismisses
- [ ] Reset game returns all pieces to wells
- [ ] Shake-to-reset (if enabled)

### Settings
- [ ] Gravity Shift Preview toggle works
- [ ] Piece Drop Preview toggle works
- [ ] Winning Move Highlights toggle works
- [ ] All toggles persist across app restart

## Performance Targets

### Startup
- [ ] Cold start to interactive: < 3 seconds
- [ ] Continue game load: < 1 second

### Frame Pacing
- [ ] Piece drag: 60fps (no drops during pan gesture)
- [ ] Gravity animation: 60fps
- [ ] Win celebration animation: no jank

### Memory
- [ ] No memory growth after repeated new game / reset cycles
- [ ] No leaked timers after screen transitions
- [ ] Shared values properly cleaned up

## iOS Specific
- [ ] Build succeeds with `expo run:ios`
- [ ] Test on iPhone SE (smallest screen)
- [ ] Test on iPhone 15 Pro Max (largest screen)
- [ ] Test on iPad (if universal)
- [ ] IAP tested in sandbox environment
- [ ] Restore Purchases works in sandbox
- [ ] Privacy manifest (`PrivacyInfo.xcprivacy`) accurate
- [ ] App Store screenshots current

## Android Specific
- [ ] Build succeeds with `expo run:android`
- [ ] Test on small screen (360dp width)
- [ ] Test on large screen (tablet)
- [ ] Google Play billing tested
- [ ] Restore Purchases works
- [ ] ProGuard rules don't strip required code

## Store Compliance
- [ ] IAP disclosure in app description
- [ ] Privacy policy URL set
- [ ] Restore Purchases accessible (required by Apple)
- [ ] No misleading IAP UI (prices shown before purchase)
- [ ] Age rating appropriate
- [ ] App icons and splash screen current

## Final Checks
- [ ] Remove all `console.log` / `console.warn` from production paths
- [ ] No debug-only code in release build
- [ ] Version number bumped in `app.json`
- [ ] Changelog updated
- [ ] Git tag created for release
