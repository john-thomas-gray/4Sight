import { animateWinner, resetAllPieces } from "@/animations/pieceAnimations";
import { GameElements, Logic } from "@/constants";
import {
  pieceAnimSharedValues,
  RESET_PIECE_DELAY,
  RESET_PIECE_DURATION,
  WINNER_BASE_DELAY,
  WINNER_V0,
  WINNER_V1,
} from "@/constants/animations";
import { useHasSavedGame } from "@/hooks/useHasSavedGame";
import { useSuppressHighlights } from "@/hooks/useSuppressHighlights";
import { PieceAnimation } from "@/types/animation";
import { Team } from "@/types/board";
import {
  LogicAnimationsContextType,
  LogicBoardStateContextType,
  LogicGameFlowContextType,
  LogicInteractionsContextType,
  LogicUIContextType,
} from "@/types/context";
import {
  GameMode,
  GameState,
  PieceProps,
  PieceStatus,
  PieceStatusMap,
} from "@/types/logic";
import { buildInitialWellPieceLocations } from "@/utils/buildInitialWellPieceLocations";
import { buildTeamPieces } from "@/utils/buildTeamPieces";
import findPieceRelationships, {
  BoardPiece,
  BoardPieces,
} from "@/utils/findPieceRelationships";
import { PersistedAppState } from "@/utils/useAsyncStorage";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { cancelAnimation, useSharedValue } from "react-native-reanimated";
import { useLayout } from "./LayoutContext";

// Sub-contexts
const LogicUIContext = createContext<LogicUIContextType | undefined>(undefined);
const LogicGameFlowContext = createContext<
  LogicGameFlowContextType | undefined
>(undefined);
const LogicBoardStateContext = createContext<
  LogicBoardStateContextType | undefined
>(undefined);
const LogicAnimationsContext = createContext<
  LogicAnimationsContextType | undefined
>(undefined);
const LogicInteractionsContext = createContext<
  LogicInteractionsContextType | undefined
>(undefined);

export const LogicProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.TwoPlayer);

  const [playersTurn, setPlayersTurn] = useState<1 | 2 | 3 | 4>(1);
  const [turnCount, setTurnCount] = useState<number>(0);
  const [gameState, setGameState] = useState<GameState>(GameState.PreGame);
  const [winner, setWinner] = useState<Team>(Team.Unassigned);
  const [moveInProgress, setMoveInProgress] = useState(false);
  const setMIP = ({ setting, delay }: { setting: boolean; delay?: number }) => {
    const id = setTimeout(() => setMoveInProgress(setting), delay || 0);
    return () => clearTimeout(id);
  };

  /* Piece Trackers */
  const [pieces, setPieces] = useState<Record<string, PieceProps>>({});
  const [wellPieceLocations, setWellPieceLocations] = useState<
    Record<string, string>
  >({});
  const [boardPieceLocations, setBoardPieceLocations] = useState<
    Record<string, string>
  >({});

  const { wells, spaces, layoutReady } = useLayout();

  /* Visual Effects */

  const pieceAnimSharedValuesRef = useRef(pieceAnimSharedValues);
  const [nextTurnWins, setNextTurnWins] = useState<Record<string, boolean>>({});
  const highlightPulse = useSharedValue(0);
  const [previewPieces, setPreviewPieces] = useState<Record<string, boolean>>(
    {}
  );
  const [isPreviewingGravity, setIsPreviewingGravity] = useState(false);
  const [gravityAnimating, setGravityAnimating] = useState(false);
  const [hasSavedGame, setHasSavedGame] = useState(false);

  useSuppressHighlights({
    highlightPulse,
    isPreviewingGravity,
    gravityAnimating,
    gameState,
    nextTurnWins,
  });

  const { refreshHasSavedGame } = useHasSavedGame({ setHasSavedGame });

  ///* Interactions Logic */
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  // Tracks whether we rehydrated from saved state to avoid overwriting
  const rehydratedRef = useRef(false);
  // Holds cleanup for any scheduled winner timeouts so we can clear them on reset/new schedules
  const winnerCleanupRef = useRef<null | (() => void)>(null);
  const resetGameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const boardPosInitdRef = useRef(false);
  const wellPosInitRef = useRef(false);

  // Ensure piece positions are updated after pieces are created or rehydrated
  // Only run once on initial setup/rehydration, not on every boardPieceLocations change
  React.useEffect(() => {
    // if (!layoutReady || Object.keys(pieces).length === 0) return;

    // Update positions for pieces in wells (only if not yet initialized or rehydrated)
    if (!wellPosInitRef.current && layoutReady) {
      Object.entries(initialWellPieceLocations.current).forEach(
        ([wellId, pieceId]) => {
          const wellLayout =
            wells[Team.TeamOne][wellId] || wells[Team.TeamTwo][wellId];
          const anim = pieceAnimSharedValuesRef.current[pieceId];
          if (wellLayout && anim) {
            anim.translateX.value =
              wellLayout.pageX +
              wellLayout.width / 2 -
              GameElements.PIECE_RADIUS;
            anim.translateY.value =
              wellLayout.pageY +
              wellLayout.height / 2 -
              GameElements.PIECE_RADIUS;
          }
          wellPosInitRef.current = true;
        }
      );

      // Update positions for pieces on the board (only if rehydrated from saved state)
      if (rehydratedRef.current && !boardPosInitdRef.current) {
        Object.entries(boardPieceLocations).forEach(([spaceId, pieceId]) => {
          const spaceLayout = spaces[spaceId];
          const anim = pieceAnimSharedValuesRef.current[pieceId];
          if (spaceLayout && anim) {
            anim.translateX.value =
              spaceLayout.pageX +
              spaceLayout.width / 2 -
              GameElements.PIECE_RADIUS;
            anim.translateY.value =
              spaceLayout.pageY +
              spaceLayout.height / 2 -
              GameElements.PIECE_RADIUS;
          }
        });
        boardPosInitdRef.current = true;
      }
      rehydratedRef.current = false;
    }
  }, [
    layoutReady,
    pieces,
    wellPieceLocations,
    wells,
    spaces,
    boardPieceLocations,
  ]);

  React.useEffect(() => {
    if (Object.keys(pieces).length === 0) {
      boardPosInitdRef.current = false;
    }
  }, [pieces]);

  React.useEffect(() => {
    return () => {
      if (resetGameTimeoutRef.current) {
        clearTimeout(resetGameTimeoutRef.current);
      }
    };
  }, []);

  const initialPieceStatusMap: PieceStatusMap = {};
  for (let i = 0; i < 48; i++) {
    initialPieceStatusMap[i.toString()] = PieceStatus.inWell;
  }

  const [pieceStatusMap, setPieceStatusMap] = useState<PieceStatusMap>(
    initialPieceStatusMap
  );

  const initialWellPieceLocations = useRef(buildInitialWellPieceLocations());

  const getNextPlayersTurn = (currentTurn: number): 1 | 2 | 3 | 4 => {
    return ((currentTurn % 4) + 1) as 1 | 2 | 3 | 4;
  };

  const incrementTurnNumber = useCallback(() => {
    setGameState((prev) =>
      prev === GameState.Ready ? GameState.Playing : prev
    );
    setPlayersTurn((prev) => getNextPlayersTurn(prev));
    setTurnCount((prev) => prev + 1);
  }, []);

  const currentTeam = playersTurn % 2 === 0 ? Team.TeamTwo : Team.TeamOne;

  const checkGameFinished = useCallback(
    (updatedBoardPieceLocations: Record<string, string>) => {
      if (winnerCleanupRef.current) {
        winnerCleanupRef.current();
        winnerCleanupRef.current = null;
      }
      const pieceRelationships = findPieceRelationships({
        boardPieceLocations: updatedBoardPieceLocations,
        winLen: Logic.WIN_LENGTH,
        allPieces: pieces,
      });

      type SetWinningPieces = {
        partials: Pick<
          Record<Team, BoardPieces[]>,
          Team.TeamOne | Team.TeamTwo
        >;
        winners: Pick<Record<Team, BoardPieces[]>, Team.TeamOne | Team.TeamTwo>;
        setPieces: React.Dispatch<
          React.SetStateAction<Record<string, PieceProps>>
        >;
        animations: Record<string, PieceAnimation>;
      };

      function setWinningPieces({ winners, animations }: SetWinningPieces) {
        const timeoutIds: ReturnType<typeof setTimeout>[] = [];
        const updatePieceStatus = (
          groups: BoardPieces[],
          pieceStatus: PieceStatus
        ) => {
          const pieceAnims = animations;
          const CASCADE_STEP = WINNER_V1 + WINNER_V0;
          let pieceIdx = 0;
          groups.forEach((group) => {
            group.forEach((boardPiece: BoardPiece) => {
              const delay = WINNER_BASE_DELAY + pieceIdx * CASCADE_STEP;
              const id = setTimeout(() => {
                setPieceStatusMap((prev) => ({
                  ...prev,
                  [boardPiece.pieceId]: pieceStatus,
                }));
                animateWinner({
                  ...pieceAnims[boardPiece.pieceId],
                });
              }, delay);
              timeoutIds.push(id);
              pieceIdx += 1;
            });
          });
        };

        const winnersOne = winners.teamOne;
        const winnersTwo = winners.teamTwo;

        updatePieceStatus(winnersOne, PieceStatus.winner);
        updatePieceStatus(winnersTwo, PieceStatus.winner);
        return () => timeoutIds.forEach((id) => clearTimeout(id));
      }

      winnerCleanupRef.current = setWinningPieces({
        partials: pieceRelationships.partials,
        winners: pieceRelationships.winners,
        setPieces,
        animations: pieceAnimSharedValues,
      });

      const mergedNextTurnWins = new Set<string>([
        ...pieceRelationships.winNextTurns[Team.TeamOne],
        ...pieceRelationships.winNextTurns[Team.TeamTwo],
      ]);
      const nextTurnWinsMap: Record<string, boolean> = {};
      mergedNextTurnWins.forEach((sid) => (nextTurnWinsMap[sid] = true));
      setNextTurnWins(nextTurnWinsMap);

      const teamOneWins =
        Object.keys(pieceRelationships.winners.teamOne).length > 0;
      const teamTwoWins =
        Object.keys(pieceRelationships.winners.teamTwo).length > 0;
      const bothTeamsWin = teamOneWins && teamTwoWins;

      const winnerTeam = bothTeamsWin
        ? Team.Both
        : teamOneWins
        ? Team.TeamOne
        : teamTwoWins
        ? Team.TeamTwo
        : Team.Unassigned;

      if (winnerTeam !== Team.Unassigned) {
        setWinner(winnerTeam);
        setGameState(GameState.Finished);
      } else {
        incrementTurnNumber();
      }
      console.log("gameState", gameState);
    },
    [gameState, incrementTurnNumber, pieces]
  );

  const computeStartingPlayer = useCallback((): 1 | 2 | 3 | 4 => {
    if (gameState === GameState.Finished || gameState === GameState.PreGame) {
      if (winner === Team.TeamOne) return 1;
      if (winner === Team.TeamTwo) return 2;
      return 1;
    }

    if (gameState === GameState.Playing) {
      return getNextPlayersTurn(playersTurn);
    }

    return 1;
  }, [gameState, playersTurn, winner]);

  const resetTransientState = useCallback(() => {
    setIsGlobalLoading(false);
    setMoveInProgress(false);
    setGravityAnimating(false);
    setIsPreviewingGravity(false);
    setPreviewPieces({});
  }, [
    setIsGlobalLoading,
    setMoveInProgress,
    setGravityAnimating,
    setIsPreviewingGravity,
    setPreviewPieces,
  ]);

  const applyStartingState = useCallback(
    ({
      reusePieces,
      boardSnapshot,
      wellSnapshot,
      startingPlayer,
    }: {
      reusePieces: boolean;
      boardSnapshot?: Record<string, string>;
      wellSnapshot?: Record<string, string>;
      startingPlayer: 1 | 2 | 3 | 4;
    }) => {
      if (!layoutReady) return;

      boardPosInitdRef.current = false;
      wellPosInitRef.current = false;
      rehydratedRef.current = false;
      const hasExistingPieces = Object.keys(pieces).length > 0;

      let nextPieces = pieces;
      let nextWellLocationsSource = wellSnapshot
        ? { ...wellSnapshot }
        : { ...initialWellPieceLocations.current };

      const canBuildPieces =
        Object.keys(wells[Team.TeamOne]).length > 0 &&
        Object.keys(wells[Team.TeamTwo]).length > 0;

      if ((!reusePieces || !hasExistingPieces) && canBuildPieces) {
        const teamOneResult = buildTeamPieces(
          Team.TeamOne,
          0,
          wells[Team.TeamOne],
          pieceAnimSharedValuesRef.current
        );
        const teamTwoResult = buildTeamPieces(
          Team.TeamTwo,
          24,
          wells[Team.TeamTwo],
          pieceAnimSharedValuesRef.current
        );

        nextPieces = {
          ...teamOneResult.pieces,
          ...teamTwoResult.pieces,
        };

        nextWellLocationsSource = {
          ...teamOneResult.wellMap,
          ...teamTwoResult.wellMap,
        };

        initialWellPieceLocations.current = nextWellLocationsSource;
        setPieces(nextPieces);
      }

      const freshPieceStatusMap: PieceStatusMap = {};
      for (let i = 0; i < 48; i++) {
        freshPieceStatusMap[i.toString()] = PieceStatus.inWell;
      }

      setPieceStatusMap(freshPieceStatusMap);
      setWellPieceLocations(initialWellPieceLocations.current);
      setBoardPieceLocations({});
      setTurnCount(1);
      setPlayersTurn(startingPlayer);
      setGameState(GameState.Ready);
      resetGameTimeoutRef.current = null;
    },
    [
      layoutReady,
      pieces,
      setBoardPieceLocations,
      setGameState,
      setPieceStatusMap,
      setPlayersTurn,
      setPieces,
      setTurnCount,
      setWellPieceLocations,
      wells,
      pieceAnimSharedValuesRef,
    ]
  );

  const setUpGame = useCallback(() => {
    if (rehydratedRef.current) return;
    if (Object.keys(pieces).length > 0) return;

    resetTransientState();
    const startingPlayer = computeStartingPlayer();
    applyStartingState({ reusePieces: false, startingPlayer });
  }, [applyStartingState, computeStartingPlayer, pieces, resetTransientState]);

  // Initial game setup when layout is ready and we haven't rehydrated
  React.useEffect(() => {
    if (!layoutReady) return;

    const timeoutId = setTimeout(() => {
      if (rehydratedRef.current) return;
      setUpGame();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [layoutReady, setUpGame]);

  const resetGame = useCallback(() => {
    cancelAnimation(highlightPulse);

    if (resetGameTimeoutRef.current) {
      clearTimeout(resetGameTimeoutRef.current);
      resetGameTimeoutRef.current = null;
    }

    if (winnerCleanupRef.current) {
      winnerCleanupRef.current();
      winnerCleanupRef.current = null;
    }

    const boardSnapshot = { ...boardPieceLocations };
    const wellSnapshot = { ...wellPieceLocations };

    resetAllPieces({
      boardPieceLocations: boardSnapshot,
      wellPieceLocations: wellSnapshot,
      wells,
      pieces,
      pieceAnimations: pieceAnimSharedValuesRef.current,
    });

    const boardHasPieces = Object.keys(boardSnapshot).length > 0;

    const performStateReset = () => {
      resetTransientState();
      const startingPlayer = computeStartingPlayer();
      applyStartingState({
        reusePieces: true,
        boardSnapshot,
        wellSnapshot,
        startingPlayer,
      });
    };

    const resetDelay = boardHasPieces
      ? RESET_PIECE_DELAY + RESET_PIECE_DURATION
      : 0;

    if (resetDelay > 0) {
      resetGameTimeoutRef.current = setTimeout(performStateReset, resetDelay);
    } else {
      performStateReset();
    }
  }, [
    applyStartingState,
    boardPieceLocations,
    computeStartingPlayer,
    highlightPulse,
    pieces,
    resetTransientState,
    wells,
    wellPieceLocations,
  ]);

  const continueGame = useCallback(
    (state: PersistedAppState) => {
      const hasPiecesSnapshot = Boolean(
        state.pieces && Object.keys(state.pieces).length > 0
      );
      const hasWellSnapshot = Boolean(
        state.wellPieceLocations &&
          Object.keys(state.wellPieceLocations).length > 0
      );
      const hasBoardSnapshot = Boolean(
        state.boardPieceLocations &&
          Object.keys(state.boardPieceLocations).length > 0
      );

      const canRehydratePieces = hasPiecesSnapshot && hasWellSnapshot;

      rehydratedRef.current = canRehydratePieces || hasBoardSnapshot;

      if (state.gameMode !== undefined) setGameMode(state.gameMode);
      if (state.pieces && canRehydratePieces) setPieces(state.pieces);
      if (state.pieceStatusMap !== undefined)
        setPieceStatusMap(state.pieceStatusMap);
      if (state.wellPieceLocations && hasWellSnapshot)
        setWellPieceLocations(state.wellPieceLocations);
      if (state.boardPieceLocations && hasBoardSnapshot)
        setBoardPieceLocations(state.boardPieceLocations);
      if (state.winner !== undefined) setWinner(state.winner);
      if (state.gameState !== undefined) setGameState(state.gameState);
      if (state.playersTurn !== undefined) setPlayersTurn(state.playersTurn);
      if (state.turnCount !== undefined) setTurnCount(state.turnCount);

      if (!rehydratedRef.current) {
        boardPosInitdRef.current = false;
      }
    },
    [
      setBoardPieceLocations,
      setGameMode,
      setGameState,
      setPieces,
      setPieceStatusMap,
      setPlayersTurn,
      setTurnCount,
      setWellPieceLocations,
      setWinner,
    ]
  );

  console.log("Turn", turnCount);

  // Sub-contexts:
  const uiValue: LogicUIContextType = React.useMemo(
    () => ({ isGlobalLoading, setIsGlobalLoading }),
    [isGlobalLoading]
  );

  const gameFlowValue: LogicGameFlowContextType = React.useMemo(
    () => ({
      gameMode,
      setGameMode,
      gameState,
      setGameState,
      winner,
      setWinner,
      playersTurn,
      setPlayersTurn,
      currentTeam,
      turnCount,
      setTurnCount,
      checkGameFinished,
      setUpGame,
      resetGame,
      continueGame,
      hasSavedGame,
      setHasSavedGame,
      refreshHasSavedGame,
    }),
    [
      gameMode,
      gameState,
      winner,
      playersTurn,
      currentTeam,
      turnCount,
      checkGameFinished,
      setUpGame,
      resetGame,
      continueGame,
      hasSavedGame,
      refreshHasSavedGame,
    ]
  );

  const boardStateValue: LogicBoardStateContextType = React.useMemo(
    () => ({
      pieces,
      setPieces,
      pieceStatusMap,
      setPieceStatusMap,
      wellPieceLocations,
      setWellPieceLocations,
      boardPieceLocations,
      setBoardPieceLocations,
      nextTurnWins,
    }),
    [
      pieces,
      pieceStatusMap,
      wellPieceLocations,
      boardPieceLocations,
      nextTurnWins,
    ]
  );

  const animationsValue: LogicAnimationsContextType = React.useMemo(
    () => ({
      pieceAnimSharedValues,
      highlightPulse,
      gravityAnimating,
      setGravityAnimating,
      isPreviewingGravity,
      setIsPreviewingGravity,
      previewPieces,
      setPreviewPieces,
    }),
    [highlightPulse, gravityAnimating, isPreviewingGravity, previewPieces]
  );

  const interactionsValue: LogicInteractionsContextType = React.useMemo(
    () => ({ moveInProgress, setMoveInProgress, setMIP }),
    [moveInProgress]
  );

  return (
    <LogicUIContext.Provider value={uiValue}>
      <LogicGameFlowContext.Provider value={gameFlowValue}>
        <LogicBoardStateContext.Provider value={boardStateValue}>
          <LogicAnimationsContext.Provider value={animationsValue}>
            <LogicInteractionsContext.Provider value={interactionsValue}>
              {children}
            </LogicInteractionsContext.Provider>
          </LogicAnimationsContext.Provider>
        </LogicBoardStateContext.Provider>
      </LogicGameFlowContext.Provider>
    </LogicUIContext.Provider>
  );
};
// Slice hooks
export const useLogicUI = () => {
  const ctx = useContext(LogicUIContext);
  if (!ctx) throw new Error("useLogicUI must be used within LogicProvider");
  return ctx;
};

export const useLogicGameFlow = () => {
  const ctx = useContext(LogicGameFlowContext);
  if (!ctx)
    throw new Error("useLogicGameFlow must be used within LogicProvider");
  return ctx;
};

export const useLogicBoardState = () => {
  const ctx = useContext(LogicBoardStateContext);
  if (!ctx)
    throw new Error("useLogicBoardState must be used within LogicProvider");
  return ctx;
};

export const useLogicAnimations = () => {
  const ctx = useContext(LogicAnimationsContext);
  if (!ctx)
    throw new Error("useLogicAnimations must be used within LogicProvider");
  return ctx;
};

export const useLogicInteractions = () => {
  const ctx = useContext(LogicInteractionsContext);
  if (!ctx)
    throw new Error("useLogicInteractions must be used within LogicProvider");
  return ctx;
};
