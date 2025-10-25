import { animateWinner, resetAllPieces } from "@/animations/pieceAnimations";
import { GameElements, Logic } from "@/constants";
import {
  WINNER_BASE_DELAY,
  WINNER_V0,
  WINNER_V1,
} from "@/constants/animations";
import { PieceAnimation, usePieceAnimations } from "@/hooks/usePieceAnimations";
import { Team } from "@/types/board";
import {
  GameMode,
  GameState,
  PieceProps,
  PieceStatus,
  PieceStatusMap,
  Turn,
} from "@/types/logic";
import findPieceRelationships, {
  BoardPiece,
  BoardPieces,
} from "@/utils/findPieceRelationships";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import type { SharedValue } from "react-native-reanimated";
import {
  cancelAnimation,
  Easing,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
// reanimated helpers used in animation helpers module
import { PersistedAppState } from "@/utils/useAsyncStorage";
import { useLayout } from "./LayoutContext";

export type LogicContextType = {
  gameMode: GameMode;
  setGameMode: React.Dispatch<React.SetStateAction<GameMode>>;
  turnCount: number;
  setTurnCount: React.Dispatch<React.SetStateAction<number>>;
  currentTeam: Team;
  checkGameFinished: (updatedBoard: Record<string, string>) => void;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  winner: Team;
  setWinner: React.Dispatch<React.SetStateAction<Team>>;
  pieces: Record<string, PieceProps>;
  setPieces: React.Dispatch<React.SetStateAction<Record<string, PieceProps>>>;
  pieceAnimations: Record<string, PieceAnimation>;
  pieceStatusMap: PieceStatusMap;
  setPieceStatusMap: React.Dispatch<React.SetStateAction<PieceStatusMap>>;
  playersTurn: 1 | 2 | 3 | 4;
  setPlayersTurn: React.Dispatch<React.SetStateAction<1 | 2 | 3 | 4>>;
  moveInProgress: boolean;
  setMoveInProgress: React.Dispatch<React.SetStateAction<boolean>>;
  setMIP: ({ setting, delay }: { setting: boolean; delay?: number }) => void;
  wellPieceLocations: Record<string, string>;
  setWellPieceLocations: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  boardPieceLocations: Record<string, string>;
  setBoardPieceLocations: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  resetGame: (playersTurn: 1 | 2 | 3 | 4, forfeit: boolean) => void;
  previewPieces: Record<string, boolean>;
  setPreviewPieces: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  rehydrateFromSavedState: (state: PersistedAppState) => void;
  nextTurnWins: Record<string, boolean>;
  highlightPulse: SharedValue<number>;
  isPreviewingGravity: boolean;
  setIsPreviewingGravity: React.Dispatch<React.SetStateAction<boolean>>;
  gravityAnimating: boolean;
  setGravityAnimating: React.Dispatch<React.SetStateAction<boolean>>;
  isGlobalLoading: boolean;
  setIsGlobalLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const LogicContext = createContext<LogicContextType | undefined>(undefined);

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

  const { wells, layoutReady } = useLayout();

  /* When a dropped piece makes a space activate highlightPulse,
  that space's highlightPulse -- and only that space's highlightPulse --
  should not start until the piece has stopped animating.
  The newly made highlightPulse space(s) should start pulsing the
   next time highlightPulse.value reaches 0 after the newest piece's
   animation has fully stopped. */

  /* Visual Effects */
  const pieceAnimations = usePieceAnimations();
  const pieceAnimationsRef = useRef(pieceAnimations);
  React.useEffect(() => {
    pieceAnimationsRef.current = pieceAnimations;
  }, [pieceAnimations]);
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
      // fade down to base color and hold at 0
      highlightPulse.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      });
    } else {
      // restart pulse from base
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
  }, [isPreviewingGravity, gravityAnimating, gameState, nextTurnWins]);

  ///* Big Game Logic */
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
        const anim = pieceAnimationsRef.current[id];
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
    if (!layoutReady) return;
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
        animations: pieceAnimations,
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
        /* This should NOT be incrementTurnNumber.
        Replace with a dedicated function for
        advancing the turn */
        incrementTurnNumber();
      }
      console.log(gameState);
    },
    [pieces, pieceAnimations, incrementTurnNumber]
  );

  const resetGame = useCallback(
    (startingPlayersTurn: Turn, forfeit: boolean) => {
      const baseStartingTurn =
        gameState === GameState.PostGame || gameState === GameState.Finished
          ? winner === Team.TeamOne
            ? 1
            : winner === Team.TeamTwo
            ? 2
            : startingPlayersTurn
          : gameState === GameState.Playing && forfeit
          ? getNextPlayersTurn(playersTurn)
          : startingPlayersTurn;

      const nextPlayersTurn = forfeit
        ? getNextPlayersTurn(baseStartingTurn)
        : baseStartingTurn;

      // Clear any previously scheduled winner animations before resetting
      if (winnerCleanupRef.current) {
        winnerCleanupRef.current();
        winnerCleanupRef.current = null;
      }

      setWinner(Team.Unassigned);
      setGameState(GameState.Ready);
      setMoveInProgress(false);
      setTurnCount(0);

      resetAllPieces({
        boardPieceLocations,
        wellPieceLocations,
        wells,
        pieces,
        pieceAnimations,
      });

      setBoardPieceLocations({});
      setWellPieceLocations({});
      cancelAnimation(highlightPulse);

      setPlayersTurn(nextPlayersTurn);
      firstTurn.current = true;
    },
    [
      layoutReady,
      wells,
      boardPieceLocations,
      wellPieceLocations,
      pieces,
      pieceAnimations,
      gameState,
      playersTurn,
      winner,
      highlightPulse,
    ]
  );

  const contextValue = React.useMemo(
    () => ({
      gameMode,
      setGameMode,
      turnCount,
      setTurnCount,
      currentTeam,
      checkGameFinished,
      gameState,
      setGameState,
      winner,
      setWinner,
      pieces,
      setPieces,
      pieceAnimations,
      pieceStatusMap,
      playersTurn,
      setPlayersTurn,
      setPieceStatusMap,
      moveInProgress,
      setMoveInProgress,
      setMIP,
      wellPieceLocations,
      setWellPieceLocations,
      boardPieceLocations,
      setBoardPieceLocations,
      resetGame,
      previewPieces,
      setPreviewPieces,
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
      nextTurnWins,
      highlightPulse,
      isPreviewingGravity,
      setIsPreviewingGravity,
      gravityAnimating,
      setGravityAnimating,
      isGlobalLoading,
      setIsGlobalLoading,
    }),
    [
      gameMode,
      turnCount,
      currentTeam,
      gameState,
      winner,
      pieces,
      pieceAnimations,
      pieceStatusMap,
      playersTurn,
      moveInProgress,
      wellPieceLocations,
      boardPieceLocations,
      checkGameFinished,
      resetGame,
      previewPieces,
      nextTurnWins,
      gravityAnimating,
      isGlobalLoading,
    ]
  );

  const firstTurn = useRef(true);
  React.useEffect(() => {
    if (!layoutReady) return;
    if (rehydratedRef.current) return;
    if (firstTurn.current) {
      firstTurn.current = false;
      return;
    }
    const t = setTimeout(() => {
      setGameState(GameState.Ready);
    }, 300);
    return () => clearTimeout(t);
  }, [layoutReady]);

  console.log("Turn", turnCount);
  return (
    <LogicContext.Provider value={contextValue}>
      {children}
    </LogicContext.Provider>
  );
};

export const useLogic = () => {
  const context = useContext(LogicContext);
  if (!context) throw new Error("useLogic must be used within LogicProvider");
  return context;
};
