import { createGame } from "../game";
import { applyMove, legalMoves } from "../moves";
import { searchPositionKey, searchTransitions, toGameMove, toSearchPosition } from "../searchPosition";
import { scenarios } from "@/dev/scenarios";

it("matches every legal engine successor across deterministic games and gravity scenarios", () => {
  let seed = 752;
  const pick = (count: number) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % count; };
  let state = createGame();
  const positions = [
    { ...createGame(), board: scenarios.tieGame.board },
    { ...createGame(), board: scenarios.gravityWin.board, currentTeam: scenarios.gravityWin.currentTeam },
  ];
  for (let i = 0; i < 120; i++) {
    const moves = legalMoves(state);
    if (state.status !== "playing" || !moves.length) state = createGame();
    else state = applyMove(state, moves[pick(moves.length)]);
    positions.push(state);
  }
  for (const position of positions) {
    const compact = toSearchPosition(position);
    const before = searchPositionKey(compact);
    const expected = new Set(legalMoves(position).map(move => searchPositionKey(toSearchPosition(applyMove(position, move)))));
    const actual = searchTransitions(compact);
    expect(new Set(actual.map(t => searchPositionKey(t.state)))).toEqual(expected);
    for (const transition of actual) {
      const engineResult = applyMove(position, toGameMove(position, transition.move));
      expect(transition.state).toEqual(toSearchPosition(engineResult));
    }
    expect(searchPositionKey(compact)).toBe(before);
  }
});
