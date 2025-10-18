import { animatePieceReset, animateWinner } from "@/animations/pieceAnimations";
import { GameElements, Logic } from "@/constants";
import {
  WINNER_BASE_DELAY,
  WINNER_V0,
  WINNER_V1,
} from "@/constants/animations";
import { PieceAnimation, usePieceAnimations } from "@/hooks/usePieceAnimations";
import { Direction, Team } from "@/types/board";
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
  nextTurn: () => void;
  checkGameFinished: (updatedBoard: Record<string, string>) => void;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  winner: Team;
  setWinner: React.Dispatch<React.SetStateAction<Team>>;
  pieces: Record<string, PieceProps>;
  setPieces: React.Dispatch<React.SetStateAction<Record<string, PieceProps>>>;
  pieceAnimations: Record<string, PieceAnimation>;
  pieceStatusMap: PieceStatusMap;
  playersTurn: 1 | 2 | 3 | 4;
  setPlayersTurn: React.Dispatch<React.SetStateAction<1 | 2 | 3 | 4>>;
  setPieceStatusMap: React.Dispatch<React.SetStateAction<PieceStatusMap>>;
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
  previewHiddenPieces: Record<string, boolean>;
  setPreviewHiddenPieces: React.Dispatch<
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
  lastGravityDirection?: Direction;
  setLastGravityDirection?: React.Dispatch<
    React.SetStateAction<Direction | undefined>
  >;
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
  const [pieces, setPieces] = useState<Record<string, PieceProps>>({});
  const { wells, layoutReady } = useLayout();
  const pieceAnimations = usePieceAnimations();
  const pieceAnimationsRef = useRef(pieceAnimations);
  React.useEffect(() => {
    pieceAnimationsRef.current = pieceAnimations;
  }, [pieceAnimations]);
  const [moveInProgress, setMoveInProgress] = useState(false);
  const setMIP = ({ setting, delay }: { setting: boolean; delay?: number }) => {
    setTimeout(() => setMoveInProgress(setting), delay || 0);
  };

  const [wellPieceLocations, setWellPieceLocations] = useState<
    Record<string, string>
  >({});
  const [boardPieceLocations, setBoardPieceLocations] = useState<
    Record<string, string>
  >({});

  const [previewHiddenPieces, setPreviewHiddenPieces] = useState<
    Record<string, boolean>
  >({});

  /* When a dropped piece makes a space activate highlightPulse,
  that space's highlightPulse -- and only that space's highlightPulse --
  should not start until the piece has stopped animating.
  The newly made highlightPulse space(s) should start pulsing the
   next time highlightPulse.value reaches 0 after the newest piece's
   animation has fully stopped. */

  // Spaces that result in a win on the next turn (for either team)
  const [nextTurnWins, setNextTurnWins] = useState<Record<string, boolean>>({});

  // Global pulse shared value to keep all highlights perfectly in sync
  const highlightPulse = useSharedValue(0);

  // Whether the user is currently long-press previewing a gravity shift
  const [isPreviewingGravity, setIsPreviewingGravity] = useState(false);
  // Whether the gravity pull animation is currently running
  const [gravityAnimating, setGravityAnimating] = useState(false);
  // Global loading overlay across screens
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [lastGravityDirection, setLastGravityDirection] = useState<
    Direction | undefined
  >(undefined);
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

  // Tracks whether we rehydrated from saved state to avoid overwriting
  const rehydratedRef = useRef(false);
  const { spaces } = useLayout();
  // Ensure we only snap positions once after rehydration
  const rehydrationPositionsAppliedRef = useRef(false);

  // Ensure animations match saved locations once layout is ready
  React.useEffect(() => {
    if (!layoutReady) return;
    if (!rehydratedRef.current) return;
    if (rehydrationPositionsAppliedRef.current) return;

    try {
      Object.entries(pieces).forEach(([pieceId, p]) => {
        const anim = pieceAnimations[pieceId];
        if (!anim) return;

        // On-board position
        const onBoardEntry = Object.entries(boardPieceLocations).find(
          ([, id]) => id === pieceId
        );
        if (onBoardEntry) {
          const [spaceId] = onBoardEntry;
          const spaceLayout = spaces[spaceId];
          if (spaceLayout) {
            anim.translateX.value =
              spaceLayout.pageX +
              spaceLayout.width / 2 -
              GameElements.PIECE_RADIUS;
            anim.translateY.value =
              spaceLayout.pageY +
              spaceLayout.height / 2 -
              GameElements.PIECE_RADIUS;
          }
          return;
        }

        // In-well position
        const inWellEntry = Object.entries(wellPieceLocations).find(
          ([, id]) => id === pieceId
        );
        if (inWellEntry) {
          const [wellId] = inWellEntry;
          const wellLayout = wells[p.team]?.[wellId];
          if (wellLayout) {
            anim.translateX.value =
              wellLayout.pageX +
              wellLayout.width / 2 -
              GameElements.PIECE_RADIUS;
            anim.translateY.value =
              wellLayout.pageY +
              wellLayout.height / 2 -
              GameElements.PIECE_RADIUS;
          }
        }
      });
      rehydrationPositionsAppliedRef.current = true;
    } catch {}
  }, [layoutReady, spaces, wells, pieces, pieceAnimations]);

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

  /* Look into logical strategies for implementing two game modes */
  const getNextPlayersTurn = (currentTurn: number): 1 | 2 | 3 | 4 => {
    return ((currentTurn % 4) + 1) as 1 | 2 | 3 | 4;
  };

  const nextTurn = useCallback(() => {
    setGameState((prev) =>
      prev === GameState.Ready ? GameState.Playing : prev
    );
    setPlayersTurn((prev) => getNextPlayersTurn(prev));
    setTurnCount((prev) => prev + 1);
  }, []);

  const currentTeam = playersTurn % 2 === 0 ? Team.TeamTwo : Team.TeamOne;

  const checkGameFinished = useCallback(
    (updatedBoardPieceLocations: Record<string, string>) => {
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

      function setWinningPieces({
        partials,
        winners,
        setPieces,
        animations,
      }: SetWinningPieces) {
        const updatePieceStatus = (
          groups: BoardPieces[],
          pieceStatus: PieceStatus
        ) => {
          const pieceAnims = animations;
          // Keep step equal to actual winner duration to maintain synchrony
          const CASCADE_STEP = WINNER_V1 + WINNER_V0;
          let pieceIdx = 0;
          groups.forEach((group) => {
            group.forEach((boardPiece: BoardPiece) => {
              const delay = WINNER_BASE_DELAY + pieceIdx * CASCADE_STEP;
              setTimeout(() => {
                setPieceStatusMap((prev) => ({
                  ...prev,
                  [boardPiece.pieceId]: pieceStatus,
                }));
                animateWinner({
                  ...pieceAnims[boardPiece.pieceId],
                });
              }, delay);
              pieceIdx += 1;
            });
          });
        };

        const winnersOne = winners.teamOne;
        const winnersTwo = winners.teamTwo;
        // const partialsOne = partials.teamOne;
        // const partialsTwo = partials.teamTwo;

        updatePieceStatus(winnersOne, PieceStatus.winner);
        updatePieceStatus(winnersTwo, PieceStatus.winner);
        // updatePieceStatus(partialsOne, PieceStatus.partial);
        // updatePieceStatus(partialsTwo, PieceStatus.partial);
      }
      // console.log("pieceR", pieceRelationships)

      setWinningPieces({
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
        nextTurn();
      }
      console.log(gameState);
    },
    [pieces, pieceAnimations, nextTurn]
  );

  const resetGame = useCallback(
    (startingPlayersTurn: 1 | 2 | 3 | 4, forfeit: boolean) => {
      // Ensure a fresh start (not treated as rehydration)
      rehydratedRef.current = false;
      rehydrationPositionsAppliedRef.current = false;
      // Determine base starting turn: if ending a game, use current turn holder
      const baseStartingTurn =
        gameState === GameState.PostGame || gameState === GameState.Finished
          ? playersTurn
          : gameState === GameState.Playing
          ? getNextPlayersTurn(playersTurn)
          : startingPlayersTurn;
      // Apply forfeit rule if applicable
      const nextPlayersTurn = forfeit
        ? getNextPlayersTurn(baseStartingTurn)
        : baseStartingTurn;

      // Reset core gameplay state
      setWinner(Team.Unassigned);
      setGameState(GameState.Ready);
      setMoveInProgress(false);
      setTurnCount(0);

      // Animate on-board pieces back to an empty team well before resetting maps
      try {
        animatePieceReset({
          boardPieceLocations,
          wellPieceLocations,
          wells,
          pieces,
          pieceAnimations,
          duration: 500,
        });
      } catch {
        // no-op: animation is best-effort during reset
      }

      // Reset board relationships
      setBoardPieceLocations({});
      setWellPieceLocations({});

      // Reset piece status map
      const freshPieceStatusMap: PieceStatusMap = {};
      for (let i = 0; i < 48; i++) {
        freshPieceStatusMap[i.toString()] = PieceStatus.inWell;
      }
      setPieceStatusMap(freshPieceStatusMap);

      // Rebuild pieces and well mappings to Ready state if layout is available
      if (layoutReady) {
        const rebuiltPieces: Record<string, PieceProps> = {};

        // Build Team One
        const teamOneWells = Object.keys(wells[Team.TeamOne] || {});
        teamOneWells.forEach((wellId, idx) => {
          const id = `${0 + idx}`;
          rebuiltPieces[id] = { id, team: Team.TeamOne };
        });

        // Build Team Two
        const teamTwoWells = Object.keys(wells[Team.TeamTwo] || {});
        teamTwoWells.forEach((wellId, idx) => {
          const id = `${24 + idx}`;
          rebuiltPieces[id] = { id, team: Team.TeamTwo };
        });

        // Compute well piece mapping in one pass
        const newWellPieceLocations: Record<string, string> = {};
        teamOneWells.forEach((wellId, idx) => {
          newWellPieceLocations[wellId] = `${0 + idx}`;
        });
        teamTwoWells.forEach((wellId, idx) => {
          newWellPieceLocations[wellId] = `${24 + idx}`;
        });

        setPieces(rebuiltPieces);
        setWellPieceLocations(newWellPieceLocations);
      } else {
        setPieces({});
      }

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
    ]
  );

  const contextValue = React.useMemo(
    () => ({
      gameMode,
      setGameMode,
      turnCount,
      setTurnCount,
      currentTeam,
      nextTurn,
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
      previewHiddenPieces,
      setPreviewHiddenPieces,
      rehydrateFromSavedState: (state: PersistedAppState) => {
        rehydratedRef.current = true;
        rehydrationPositionsAppliedRef.current = false;
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
      lastGravityDirection,
      setLastGravityDirection,
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
      nextTurn,
      checkGameFinished,
      resetGame,
      previewHiddenPieces,
      nextTurnWins,
      gravityAnimating,
      isGlobalLoading,
      lastGravityDirection,
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
