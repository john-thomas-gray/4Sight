import { animateSessionReset } from "@/animations/sessionReset";
import { GameElements } from "@/constants";
import { buildInitialWellPieceLocations } from "@/constants/wells";
import { buildTutorialStepTwoWellPieceLocations, pieceStatusMapForBoardAndWells } from "@/tutorial/tutorialWellLayout";
import { useSettings } from "./SettingsContext";
import type { Scenario, ScenarioMove } from "@/dev/scenarios";
import { computeTieWinOverlayDelayMs, coordToKey, createGame, detectNearWins, Direction, placePiece as enginePlacePiece, shiftGravity as engineShiftGravity, findSlotForSpace, PIECES_PER_TEAM, Team, type Coord, type EngineResult, type GameState, type NearWin } from "@/engine";
import { clearSession, serializableToGameState, validateSession, type PersistedSessionState } from "@/storage";
import { type PieceAnimation, RESET_TO_WELL_TOTAL_MS } from "@/types/animation";
import { PieceStatus, type PieceStatusMap } from "@/types/pieceStatus";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cancelAnimation, makeMutable } from "react-native-reanimated";
import { createMoveCoordinator, type MoveCoordinator } from "@/session/moveCoordinator";
import { useLayout } from "./LayoutContext";
import { useUiSelector } from "./UiContext";
import { createSelectorContext } from "./selectorContext";
import { useGameSessionSideEffects } from "./useGameSessionSideEffects";
export { PieceStatus };
type SessionState = {
  mode: "onePlayer" | "twoPlayer";
  gameState: GameState;
  pieceStatusMap: PieceStatusMap;
  wellPieceLocations: Record<string, string>;
};
type GameSessionContextType = SessionState & {
  positionRevision: number;
  nearWins: NearWin[];
  nextTurnWins: Record<string, boolean>;
  pieceAnims: Record<string, PieceAnimation>;
  pieceWellLocations: Record<string, string>;
  getSessionSnapshot: () => SessionState;
  beginPieceDrag: (pieceId: string) => boolean;
  returnPieceToWell: (pieceId: string, wellId?: string) => void;
  cancelPendingMoves: () => void;
  moves: MoveCoordinator;
  dropPiece: (slotCoord: Coord, pieceId: string) => EngineResult;
  shiftGravity: (direction: Direction) => EngineResult;
  newGame: (mode?: SessionState["mode"]) => Promise<void>;
  resetCurrentGame: () => Promise<void>;
  continueGame: (session: PersistedSessionState) => void;
  loadScenario: (scenario: Scenario) => ScenarioMove[];
  applyTutorialStepTwoWells: () => void;
  tutorialWhiteDropEntryDirectionRef: React.MutableRefObject<Direction | null>;
  tieWinOverlayDelayMs: number | null;
};
const GameSessionContext = createSelectorContext<GameSessionContextType>("useGameSession");
export const useGameSessionSelector = GameSessionContext.useSelector;
export const useGameSession = () => useGameSessionSelector(value => value);
const defaultWells = buildInitialWellPieceLocations();
function initialSession(currentTeam = Team.One, mode: SessionState["mode"] = "twoPlayer"): SessionState {
  const gameState = {
    ...createGame(),
    currentTeam
  };
  const wellPieceLocations = buildInitialWellPieceLocations();
  return {
    mode,
    gameState,
    wellPieceLocations,
    pieceStatusMap: pieceStatusMapForBoardAndWells(gameState.board, wellPieceLocations)
  };
}
function buildPieceAnims(): Record<string, PieceAnimation> {
  return Object.fromEntries(Array.from({
    length: PIECES_PER_TEAM * 2
  }, (_, i) => [String(i), {
    translateX: makeMutable(0),
    translateY: makeMutable(0),
    scaleX: makeMutable(1.1),
    scaleY: makeMutable(1.1),
    color: makeMutable(i < PIECES_PER_TEAM ? "#ffffff" : "#000000"),
    winnerColor: makeMutable(i < PIECES_PER_TEAM ? "#fdffd0ff" : "#967d00ff"),
    winnerGlow: makeMutable(0),
    winnerEnergy: makeMutable(0),
    zIndex: makeMutable(500)
  }]));
}
export const GameSessionProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const layout = useLayout();
  const {
    theme
  } = useSettings();
  const {
    resetInteractions,
    setMoveInProgress
  } = useUiSelector(ui => ({
    resetInteractions: ui.resetInteractions,
    setMoveInProgress: ui.setMoveInProgress
  }));
  const [session, setSession] = useState(initialSession);
  const sessionRef = useRef(session);
  const [nextStartingTeam, setNextStartingTeam] = useState<Team>(Team.One);
  const [positionRevision, setPositionRevision] = useState(0);
  const [winningDropAnchors, setWinningDropAnchors] = useState<string[]>([]);
  const [pieceAnims] = useState(buildPieceAnims);
  const pieceAnimsRef = useRef(pieceAnims);
  const [moves] = useState(createMoveCoordinator);
  const originsRef = useRef(new Map<string, string>());
  const winnerCascadeKeyRef = useRef<string | null>(null);
  const winningDropPieceIdsRef = useRef(new Set<string>());
  const tutorialWhiteDropEntryDirectionRef = useRef<Direction | null>(null);
  const presentationRef = useRef({
    layout,
    theme,
    nextStartingTeam
  });
  useLayoutEffect(() => {
    presentationRef.current = {
      layout,
      theme,
      nextStartingTeam
    };
  }, [layout, theme, nextStartingTeam]);

  // Animation values survive screen changes. Reconcile them from the session,
  // including pieces returned to wells, before publishing a replacement game.
  const restorePiecePositions = useCallback((next: SessionState) => {
    const { layout: currentLayout, theme: currentTheme } = presentationRef.current;
    const boardLocations = Object.fromEntries(Object.entries(next.gameState.board).map(([cell, id]) => [id, cell]));
    const wellLocations = Object.fromEntries(Object.entries(next.wellPieceLocations).map(([cell, id]) => [id, cell]));
    for (const [id, anim] of Object.entries(pieceAnims)) {
      for (const value of [anim.translateX, anim.translateY, anim.scaleX, anim.scaleY, anim.zIndex, anim.winnerGlow, anim.winnerEnergy]) cancelAnimation(value);
      cancelAnimation(anim.color);
      cancelAnimation(anim.winnerColor);
      const piece = next.gameState.pieces[id];
      const onBoard = boardLocations[id] !== undefined;
      const cell = onBoard ? currentLayout.spaces[boardLocations[id]] :
        piece ? currentLayout.wells[piece.team]?.[wellLocations[id]] : undefined;
      if (cell) {
        anim.translateX.set(cell.pageX + cell.width / 2 - GameElements.PIECE_RADIUS);
        anim.translateY.set(cell.pageY + cell.height / 2 - GameElements.PIECE_RADIUS);
      }
      // With no measured destination, hide the old position until layout places it.
      const scale = cell ? onBoard ? GameElements.PIECE_BOARD_SCALE : GameElements.PIECE_WELL_SCALE : 0;
      anim.scaleX.set(scale);
      anim.scaleY.set(scale);
      anim.zIndex.set(onBoard ? GameElements.PIECE_BOARD_ZINDEX : GameElements.PIECE_WELL_ZINDEX);
      const colors = currentTheme.colorTheme;
      anim.winnerColor.set(piece?.team === Team.One ? colors.TEAM_ONE_WINNER_COLOR : colors.TEAM_TWO_WINNER_COLOR);
      anim.color.set(next.pieceStatusMap[id] === PieceStatus.winner ? anim.winnerColor.get() :
        piece?.team === Team.One ? colors.TEAM_ONE_COLOR : colors.TEAM_TWO_COLOR);
      anim.winnerGlow.set(next.pieceStatusMap[id] === PieceStatus.winner ? 1 : 0);
      anim.winnerEnergy.set(0);
    }
  }, [pieceAnims]);

  // Commands read the current transaction, including earlier commands in the same event.
  const updateSession = useCallback((update: (previous: SessionState) => SessionState) => {
    const next = update(sessionRef.current);
    sessionRef.current = next;
    setSession(next);
  }, []);
  const getSessionSnapshot = useCallback(() => sessionRef.current, []);
  const setPieceStatusMap = useCallback<React.Dispatch<React.SetStateAction<PieceStatusMap>>>(update => {
    updateSession(prev => ({
      ...prev,
      pieceStatusMap: typeof update === "function" ? update(prev.pieceStatusMap) : update
    }));
  }, [updateSession]);
  const beginPieceDrag = useCallback((pieceId: string) => {
    const current = sessionRef.current;
    const piece = current.gameState.pieces[pieceId];
    if (originsRef.current.size > 0 || current.gameState.status !== "playing" || piece?.team !== current.gameState.currentTeam) return false;
    const entry = Object.entries(current.wellPieceLocations).find(([, id]) => id === pieceId);
    if (!entry || Object.values(current.gameState.board).includes(pieceId)) return false;
    if (!moves.begin("piece")) return false;
    originsRef.current.set(pieceId, entry[0]);
    updateSession(prev => {
      const wells = {
        ...prev.wellPieceLocations
      };
      delete wells[entry[0]];
      return {
        ...prev,
        wellPieceLocations: wells,
        pieceStatusMap: {
          ...prev.pieceStatusMap,
          [pieceId]: PieceStatus.isHeld
        }
      };
    });
    return true;
  }, [updateSession, moves]);
  const returnPieceToWell = useCallback((pieceId: string, requestedWellId?: string) => {
    const current = sessionRef.current;
    const origin = originsRef.current.get(pieceId);
    if (!origin || Object.values(current.gameState.board).includes(pieceId)) return;
    const requestedDefaultPiece = requestedWellId ? defaultWells[requestedWellId] : undefined;
    const validTeam = requestedDefaultPiece !== undefined &&
      (Number(requestedDefaultPiece) < PIECES_PER_TEAM) === (current.gameState.pieces[pieceId].team === Team.One);
    const wellId = requestedWellId && validTeam && current.wellPieceLocations[requestedWellId] === undefined ? requestedWellId : origin;
    originsRef.current.delete(pieceId);
    moves.finish();
    updateSession(prev => ({
      ...prev,
      wellPieceLocations: {
        ...prev.wellPieceLocations,
        [wellId]: pieceId
      },
      pieceStatusMap: {
        ...prev.pieceStatusMap,
        [pieceId]: PieceStatus.inWell
      }
    }));
  }, [updateSession, moves]);
  const cancelPendingMoves = useCallback(() => {
    const heldOrigins = [...originsRef.current];
    moves.cancelAll();
    for (const [id] of heldOrigins) {
      returnPieceToWell(id);
    }
    restorePiecePositions(sessionRef.current);
    resetInteractions();
  }, [moves, restorePiecePositions, returnPieceToWell, resetInteractions]);
  useEffect(() => () => {
    moves.cancelAll();
  }, [moves]);
  const recordWinningMove = useCallback((result: EngineResult) => {
    const win = result.events.find(e => e.type === "game_won" || e.type === "game_tied");
    if (!win || !("lines" in win)) return;
    const winningIds = new Set(win.lines.flatMap(line => [...line.pieceIds]));
    for (const event of result.events) {
      if (event.type === "piece_placed") winningDropPieceIdsRef.current.add(event.pieceId);
      if (event.type === "gravity_shifted") for (const move of event.moves) {
        if (winningIds.has(move.pieceId)) winningDropPieceIdsRef.current.add(move.pieceId);
      }
    }
    setWinningDropAnchors([...winningDropPieceIdsRef.current]);
  }, []);
  const dropPiece = useCallback((slot: Coord, id: string): EngineResult => {
    const phase = moves.getPhase();
    if (phase === "gravity" || phase === "reset" || phase === "piece" && !originsRef.current.has(id)) {
      return {
        state: sessionRef.current.gameState,
        events: []
      };
    }
    const result = enginePlacePiece(sessionRef.current.gameState, slot, id);
    if (!result.events.some(e => e.type === "piece_placed")) return result;
    recordWinningMove(result);
    originsRef.current.delete(id);
    updateSession(prev => ({
      ...prev,
      gameState: result.state,
      wellPieceLocations: Object.fromEntries(Object.entries(prev.wellPieceLocations).filter(([, pieceId]) => pieceId !== id)),
      pieceStatusMap: {
        ...prev.pieceStatusMap,
        [id]: PieceStatus.onBoard
      }
    }));
    return result;
  }, [recordWinningMove, updateSession, moves]);
  const shiftGravity = useCallback((direction: Direction): EngineResult => {
    if (moves.getPhase() === "piece" || moves.getPhase() === "reset") return {
      state: sessionRef.current.gameState,
      events: []
    };
    const result = engineShiftGravity(sessionRef.current.gameState, direction);
    if (result.state !== sessionRef.current.gameState) {
      recordWinningMove(result);
      updateSession(prev => ({
        ...prev,
        gameState: result.state
      }));
    }
    return result;
  }, [recordWinningMove, updateSession, moves]);
  const clearSessionHistory = useCallback(() => {
    setPositionRevision(value => value + 1);
    setWinningDropAnchors([]);
    winningDropPieceIdsRef.current.clear();
    winnerCascadeKeyRef.current = null;
    tutorialWhiteDropEntryDirectionRef.current = null;
  }, []);
  const replaceSession = useCallback((next: SessionState) => {
    clearSessionHistory();
    restorePiecePositions(next);
    updateSession(() => next);
  }, [clearSessionHistory, restorePiecePositions, updateSession]);
  const newGame = useCallback(async (mode?: SessionState["mode"]) => {
    cancelPendingMoves();
    replaceSession(initialSession(presentationRef.current.nextStartingTeam, mode ?? sessionRef.current.mode));
    await clearSession();
  }, [cancelPendingMoves, replaceSession]);
  const resetCurrentGame = useCallback(async () => {
    cancelPendingMoves();
    moves.begin("reset");
    setMoveInProgress(true);
    const {
      layout: currentLayout,
      theme: currentTheme
    } = presentationRef.current;
    animateSessionReset(sessionRef.current.gameState, currentLayout, currentTheme, pieceAnims, buildInitialWellPieceLocations());
    if (!(await moves.wait(RESET_TO_WELL_TOTAL_MS))) return;
    await newGame();
  }, [cancelPendingMoves, setMoveInProgress, pieceAnims, moves, newGame]);
  const continueGame = useCallback((saved: PersistedSessionState) => {
    const validated = validateSession(saved);
    if (!validated) return;
    cancelPendingMoves();
    replaceSession({
      mode: validated.mode ?? "twoPlayer",
      gameState: serializableToGameState(validated.game),
      pieceStatusMap: validated.pieceStatusMap,
      wellPieceLocations: validated.wellPieceLocations
    });
  }, [cancelPendingMoves, replaceSession]);
  const applyTutorialStepTwoWells = useCallback(() => {
    updateSession(prev => {
      const wells = buildTutorialStepTwoWellPieceLocations(prev.gameState.board);
      return {
        ...prev,
        wellPieceLocations: wells,
        pieceStatusMap: pieceStatusMapForBoardAndWells(prev.gameState.board, wells)
      };
    });
  }, [updateSession]);
  const loadScenario = useCallback((scenario: Scenario): ScenarioMove[] => {
    cancelPendingMoves();
    if (scenario.continuation) {
      applyTutorialStepTwoWells();
      updateSession(prev => ({
        ...prev,
        gameState: {
          ...prev.gameState,
          currentTeam: scenario.currentTeam
        }
      }));
    } else {
      const boardIds = new Set(Object.values(scenario.board));
      const wells = Object.fromEntries(Object.entries(scenario.wellPieceLocations ?? buildInitialWellPieceLocations()).filter(([, id]) => !boardIds.has(id)));
      replaceSession({
        mode: "twoPlayer",
        gameState: {
          ...createGame(),
          board: {
            ...scenario.board
          },
          currentTeam: scenario.currentTeam
        },
        wellPieceLocations: wells,
        pieceStatusMap: pieceStatusMapForBoardAndWells(scenario.board, wells)
      });
    }
    return [...scenario.moves];
  }, [cancelPendingMoves, replaceSession, applyTutorialStepTwoWells, updateSession]);
  const {
    gameState,
    pieceStatusMap,
    wellPieceLocations
  } = session;
  const nearWins = useMemo(() => detectNearWins(gameState.board, gameState.pieces), [gameState.board, gameState.pieces]);
  const nextTurnWins = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (gameState.status === "playing") for (const win of nearWins) {
      if (findSlotForSpace(gameState.board, win.emptyCoord)) map[coordToKey(win.emptyCoord)] = true;
    }
    return map;
  }, [nearWins, gameState.status, gameState.board]);
  const pieceWellLocations = useMemo(() => Object.fromEntries(Object.entries(wellPieceLocations).map(([well, id]) => [id, well])), [wellPieceLocations]);
  const tieWinOverlayDelayMs = useMemo(() => gameState.status === "finished" && gameState.tie ? computeTieWinOverlayDelayMs(gameState.board, gameState.pieces, gameState.currentTeam, winningDropAnchors) : null, [gameState, winningDropAnchors]);
  useGameSessionSideEffects({
    mode: session.mode,
    gameState,
    pieceStatusMap,
    wellPieceLocations,
    setPieceStatusMap,
    setNextStartingTeam,
    pieceAnimsRef,
    winnerCascadeKeyRef,
    winningDropPieceIdsRef,
    moves
  });
  const value = useMemo<GameSessionContextType>(() => ({
    ...session,
    positionRevision,
    nearWins,
    nextTurnWins,
    pieceAnims,
    pieceWellLocations,
    getSessionSnapshot,
    beginPieceDrag,
    returnPieceToWell,
    cancelPendingMoves,
    moves,
    dropPiece,
    shiftGravity,
    newGame,
    resetCurrentGame,
    continueGame,
    loadScenario,
    applyTutorialStepTwoWells,
    tutorialWhiteDropEntryDirectionRef,
    tieWinOverlayDelayMs
  }), [session, positionRevision, nearWins, nextTurnWins, pieceAnims, pieceWellLocations, getSessionSnapshot, beginPieceDrag, returnPieceToWell, cancelPendingMoves, moves, dropPiece, shiftGravity, newGame, resetCurrentGame, continueGame, loadScenario, applyTutorialStepTwoWells, tieWinOverlayDelayMs]);
  return <GameSessionContext.Provider value={value}>{children}</GameSessionContext.Provider>;
};
