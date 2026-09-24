# Computer opponent

Choose **One Player** in the main menu. The human controls Team One (the lower wells) and the computer controls Team Two (the upper wells). The existing winner-starts-next-game behavior is retained. Continue restores the saved mode; saves without a mode remain two-player games. Tutorials and development scenarios do not run the computer opponent.

The AI (artificial intelligence) uses deterministic minimax search with alpha-beta pruning, iterative deepening to four plies (individual player actions), and a cache of positions and search bounds. It checks immediate wins and every immediate opponent reply before the deeper search budget starts. Deeper search gets 500 milliseconds and at most 50,000 visited search nodes by default, retaining only fully completed iterations. Cooperative batches release the event loop so navigation can cancel the search.

## Tactical policy

1. Take an exclusive immediate win, including a winning gravity pull. Simultaneous lines for both players are a tie, not a win.
2. When possible, discard moves that immediately lose or allow any winning opponent reply, including pulls.
3. Permit a nonwinning pull only if it safely answers an existing immediate threat, or safely creates at least two distinct winning placement squares when no safe placement can do so. This restriction applies at every computer search turn; the human's pulls remain unrestricted.
4. Use searched outcomes first. Break equal search scores by distinct winning placement squares, then total winning actions, fewer opponent winning replies, positional line value, and finally placement over pulling. A multi-square threat is only reported as a forced win when search verifies every opponent reply.

The pull restriction is absolute. If no move satisfies it, the computer reports that it has no permitted move and offers a new game; it does not invent a pass or declare a draw. Repeated positions are bounded by search depth and budget, not treated as a game-rule draw.

## Implementation

- `engine/moves.ts` enumerates legal actions through the public game engine.
- `engine/searchPosition.ts` stores 49 color cells and each team's reserves for efficient hypothetical moves. Differential tests compare its successors, winners, ties and turn advancement against the public engine across deterministic games and gravity scenarios.
- `engine/computer.ts` exposes synchronous and cooperative asynchronous selection. The selected root move is translated back to an actual available piece identifier before execution.
- `hooks/useComputerOpponent.ts` waits for the previous animation, searches, rejects stale results, and uses the existing placement and gravity animations. Screen readiness includes the board entrance animation. Session generation cancellation covers reset, navigation and replacement games.
- `storage/schema.ts` stores the optional session mode without invalidating older saves.

Tests cover immediate wins and defenses, defensive pulls, apparent forks defeated by gravity, verified forks, opponent fork prevention, pull eligibility, cancelled searches, turn scheduling and save restoration. Run `npm test -- --runInBand` and `npx tsc --noEmit` for validation.
