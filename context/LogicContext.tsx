import { animatePieceReset, animateWinner } from "@/animations/pieceAnimations";
import { Animations, GameElements, Logic } from "@/constants";
import { WINNER_BASE_DELAY } from "@/constants/animations";
import { PieceAnimation, usePieceAnimations } from "@/hooks/usePieceAnimations";
import { Team } from "@/types/board";
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
        const anim = pieceAnimations[id];
        if (layout && anim) {
          anim.translateX.value =
            layout.pageX + layout.width / 2 - GameElements.PIECE_RADIUS;
          anim.translateY.value =
            layout.pageY + layout.height / 2 - GameElements.PIECE_RADIUS;
        }
      });

      return { pieces, wellMap };
    },
    [pieceAnimations]
  );

  React.useEffect(() => {
    if (!layoutReady) return;
    if (rehydratedRef.current) return;

    // Build deterministic mappings and initial positions per team
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
  }, [layoutReady, wells]);

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
    if (gameState === GameState.Ready) {
      setGameState(GameState.Playing);
    } else if (gameState === GameState.Finished) return;
    setPlayersTurn(getNextPlayersTurn(playersTurn));
    setTurnCount((prev) => prev + 1);
  }, [gameState, playersTurn]);

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
          let baseDelay = WINNER_BASE_DELAY;

          groups.forEach((group) => {
            group.forEach((boardPiece: BoardPiece, idx) => {
              const delay = baseDelay + idx * 300; // stagger each piece
              setTimeout(() => {
                setPieceStatusMap((prev) => ({
                  ...prev,
                  [boardPiece.pieceId]: pieceStatus,
                }));
                animateWinner({
                  ...pieceAnims[boardPiece.pieceId],
                });
              }, delay);
            });
            baseDelay += group.length * 100; // increment baseDelay for next group
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
        setTimeout(() => nextTurn(), Animations.BOARD_COLOR_CHANGE);
      }
    },
    [pieces, pieceAnimations, nextTurn]
  );
  console.log(gameState);
  const resetGame = useCallback(
    (startingPlayersTurn: 1 | 2 | 3 | 4, forfeit: boolean) => {
      // Determine the players turn based on forfeit rule
      const nextPlayersTurn = forfeit
        ? getNextPlayersTurn(startingPlayersTurn)
        : startingPlayersTurn;

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

      // Apply players turn at the end to ensure derived currentTeam matches
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
    ]
  );

  const firstTurn = useRef(true);

  const debounce = setTimeout(() => {
    if (rehydratedRef.current) {
      return clearTimeout(debounce);
    }
    if (firstTurn.current) {
      firstTurn.current = false;
      return clearTimeout(debounce);
    } else if (debounce) {
      return;
    }
    setGameState(GameState.Ready);
  }, 300);

  console.log(turnCount);
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
