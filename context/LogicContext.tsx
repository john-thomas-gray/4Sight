import { animateWinner } from "@/animations/pieceAnimations";
import { GameElements, Logic } from "@/constants";
import {
  pieceAnimSharedValues,
  WINNER_BASE_DELAY,
  WINNER_V0,
  WINNER_V1,
} from "@/constants/animations";
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
import {
  cancelAnimation,
  Easing,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
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

  const [playerCanMove, setPlayerCanMove] = useState<Team>(Team.Unassigned);
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

  const { wells, layoutReady } = useLayout();

  /* Visual Effects */

  const pieceAnimSharedValuesRef = useRef(pieceAnimSharedValues);
  React.useEffect(() => {
    pieceAnimSharedValuesRef.current = pieceAnimSharedValues;
  }, []);
  const [nextTurnWins, setNextTurnWins] = useState<Record<string, boolean>>({});
  const highlightPulse = useSharedValue(0);
  const [previewPieces, setPreviewPieces] = useState<Record<string, boolean>>(
    {}
  );
  const [isPreviewingGravity, setIsPreviewingGravity] = useState(false);
  const [gravityAnimating, setGravityAnimating] = useState(false);

  React.useEffect(() => {
    cancelAnimation(highlightPulse);
    const noHighlights = Object.keys(nextTurnWins || {}).length === 0;
    const notPlaying = gameState !== GameState.Playing;
    if (isPreviewingGravity || gravityAnimating || notPlaying || noHighlights) {
      highlightPulse.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      });
    } else {
      highlightPulse.value = 0;
      highlightPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
    }
    return () => {
      cancelAnimation(highlightPulse);
    };
  }, [
    highlightPulse,
    isPreviewingGravity,
    gravityAnimating,
    gameState,
    nextTurnWins,
  ]);

  ///* Interactions Logic */
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  // Tracks whether we rehydrated from saved state to avoid overwriting
  const rehydratedRef = useRef(false);
  // Ensure we only snap positions once after rehydration
  // const rehydrationPositionsAppliedRef = useRef(false);
  // Holds cleanup for any scheduled winner timeouts so we can clear them on reset/new schedules
  const winnerCleanupRef = useRef<null | (() => void)>(null);

  const buildTeamPieces = React.useCallback(
    (
      team: Team,
      startIdx: number,
      teamWells: Record<
        string,
        { pageX: number; pageY: number; width: number; height: number }
      >
    ): {
      pieces: Record<string, PieceProps>;
      wellMap: Record<string, string>;
    } => {
      const pieces: Record<string, PieceProps> = {};
      const wellMap: Record<string, string> = {};

      // Sort wells by numeric row, then col parsed from id like "row-col"
      const sortedWellIds = Object.keys(teamWells).sort((a, b) => {
        const [ar, ac] = a.split("-").map(Number);
        const [br, bc] = b.split("-").map(Number);
        if (ar !== br) return ar - br;
        return ac - bc;
      });

      sortedWellIds.forEach((wellId, idx) => {
        const id = String(startIdx + idx);
        pieces[id] = { id, team };
        wellMap[wellId] = id;

        const layout = teamWells[wellId];
        const anim = pieceAnimSharedValuesRef.current[id];
        if (layout && anim) {
          anim.translateX.value =
            layout.pageX + layout.width / 2 - GameElements.PIECE_RADIUS;
          anim.translateY.value =
            layout.pageY + layout.height / 2 - GameElements.PIECE_RADIUS;
        }
      });

      return { pieces, wellMap };
    },
    []
  );

  React.useEffect(() => {
    // If user pressed Play (no saved board/wells), allow initial build
    // If we rehydrated (Continue), skip build to preserve saved state
    // Defer one tick so Settings rehydration can run first and set rehydratedRef
    const timeoutId = setTimeout(() => {
      if (rehydratedRef.current) return;

      // Build deterministic mappings and initial positions per team
      const { pieces: teamOnePieces, wellMap: teamOneWellMap } =
        buildTeamPieces(Team.TeamOne, 0, wells[Team.TeamOne]);
      const { pieces: teamTwoPieces, wellMap: teamTwoWellMap } =
        buildTeamPieces(Team.TeamTwo, 24, wells[Team.TeamTwo]);

      setPieces({ ...teamOnePieces, ...teamTwoPieces });
      setWellPieceLocations({ ...teamOneWellMap, ...teamTwoWellMap });
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [layoutReady, wells, buildTeamPieces]);

  const initialPieceStatusMap: PieceStatusMap = {};
  for (let i = 0; i < 48; i++) {
    initialPieceStatusMap[i.toString()] = PieceStatus.inWell;
  }
  const [pieceStatusMap, setPieceStatusMap] = useState<PieceStatusMap>(
    initialPieceStatusMap
  );

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
      // Clear any prior scheduled winner animations to avoid accumulation across games
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

      // Merge next-turn-win space ids from both teams and expose as a map
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
      console.log(gameState);
    },
    []
  );

  const resetGame = useCallback(() => {
    // !@# This is not realy in scope
    cancelAnimation(highlightPulse);

    // Rebuild initial pieces and well mappings exactly like first load
    const { pieces: teamOnePieces, wellMap: teamOneWellMap } = buildTeamPieces(
      Team.TeamOne,
      0,
      wells[Team.TeamOne]
    );
    const { pieces: teamTwoPieces, wellMap: teamTwoWellMap } = buildTeamPieces(
      Team.TeamTwo,
      24,
      wells[Team.TeamTwo]
    );
    setPieces({ ...teamOnePieces, ...teamTwoPieces });
    setWellPieceLocations({ ...teamOneWellMap, ...teamTwoWellMap });

    // Clear any previously scheduled winner animations before resetting
    if (winnerCleanupRef.current) {
      winnerCleanupRef.current();
      winnerCleanupRef.current = null;
    }

    // UI state
    setIsGlobalLoading(false);

    // Interactions
    setMoveInProgress(false);

    // Animations state
    setGravityAnimating(false);
    setIsPreviewingGravity(false);
    setPreviewPieces({});

    // Board state: clear board placements
    setBoardPieceLocations({});

    // Ensure every piece is marked in-well
    const pieceIds = Object.keys(pieces || {});
    const resetStatusMap: PieceStatusMap = {};
    pieceIds.forEach((pid) => {
      resetStatusMap[pid] = PieceStatus.inWell;
    });
    setPieceStatusMap(resetStatusMap);

    // Set turn
    const whichPlayerStarts: 1 | 2 | 3 | 4 =
      gameState === GameState.Finished
        ? winner === Team.TeamOne
          ? 1
          : winner === Team.TeamTwo
          ? 2
          : 1
        : gameState === GameState.Playing
        ? getNextPlayersTurn(playersTurn)
        : 1;

    const freshPieceStatusMap: PieceStatusMap = {};
    for (let i = 0; i < 48; i++) {
      freshPieceStatusMap[i.toString()] = PieceStatus.inWell;
    }
    setPieceStatusMap(freshPieceStatusMap);
    setPlayersTurn(whichPlayerStarts);
    setGameState(GameState.Ready);
  }, [
    buildTeamPieces,
    gameState,
    highlightPulse,
    pieces,
    playersTurn,
    wells,
    winner,
  ]);

  console.log("Turn", turnCount);
  // Provide sub-contexts to enable consumers to subscribe to smaller slices
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
      playerCanMove,
      setPlayerCanMove,
      turnCount,
      setTurnCount,
      checkGameFinished,
      resetGame,
      rehydrateFromSavedState: (state: PersistedAppState) => {
        rehydratedRef.current = true;
        if (state.gameMode !== undefined) setGameMode(state.gameMode);
        if (state.pieces !== undefined) setPieces(state.pieces);
        if (state.pieceStatusMap !== undefined)
          setPieceStatusMap(state.pieceStatusMap);
        if (state.wellPieceLocations !== undefined)
          setWellPieceLocations(state.wellPieceLocations);
        if (state.boardPieceLocations !== undefined)
          setBoardPieceLocations(state.boardPieceLocations);
        if (state.winner !== undefined) setWinner(state.winner);
        if (state.gameState !== undefined) setGameState(state.gameState);
        if (state.playersTurn !== undefined) setPlayersTurn(state.playersTurn);
        if (state.turnCount !== undefined) setTurnCount(state.turnCount);
      },
    }),
    [
      gameMode,
      gameState,
      winner,
      playersTurn,
      currentTeam,
      turnCount,
      checkGameFinished,
      resetGame,
      playerCanMove,
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
