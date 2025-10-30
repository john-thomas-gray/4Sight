import { PieceAnimation } from "@/types/animation";
import { Team } from "@/types/board";
import { GameMode, GameState, PieceProps, PieceStatusMap } from "@/types/logic";
import { SharedValue } from "react-native-reanimated";
import { PersistedAppState } from "../utils/useAsyncStorage";

type LogicUIContextType = {
  isGlobalLoading: boolean;
  setIsGlobalLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

type LogicGameFlowContextType = {
  gameMode: GameMode;
  setGameMode: React.Dispatch<React.SetStateAction<GameMode>>;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  winner: Team;
  setWinner: React.Dispatch<React.SetStateAction<Team>>;
  playersTurn: 1 | 2 | 3 | 4;
  setPlayersTurn: React.Dispatch<React.SetStateAction<1 | 2 | 3 | 4>>;
  currentTeam: Team;
  playerCanMove: Team;
  setPlayerCanMove: React.Dispatch<React.SetStateAction<Team>>;
  turnCount: number;
  setTurnCount: React.Dispatch<React.SetStateAction<number>>;
  checkGameFinished: (updatedBoard: Record<string, string>) => void;
  resetGame: () => void;
  rehydrateFromSavedState: (state: PersistedAppState) => void;
};

type LogicBoardStateContextType = {
  pieces: Record<string, PieceProps>;
  setPieces: React.Dispatch<React.SetStateAction<Record<string, PieceProps>>>;
  pieceStatusMap: PieceStatusMap;
  setPieceStatusMap: React.Dispatch<React.SetStateAction<PieceStatusMap>>;
  wellPieceLocations: Record<string, string>;
  setWellPieceLocations: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  boardPieceLocations: Record<string, string>;
  setBoardPieceLocations: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  nextTurnWins: Record<string, boolean>;
};

type LogicAnimationsContextType = {
  pieceAnimSharedValues: Record<string, PieceAnimation>;
  highlightPulse: SharedValue<number>;
  gravityAnimating: boolean;
  setGravityAnimating: React.Dispatch<React.SetStateAction<boolean>>;
  isPreviewingGravity: boolean;
  setIsPreviewingGravity: React.Dispatch<React.SetStateAction<boolean>>;
  previewPieces: Record<string, boolean>;
  setPreviewPieces: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
};

type LogicInteractionsContextType = {
  moveInProgress: boolean;
  setMoveInProgress: React.Dispatch<React.SetStateAction<boolean>>;
  setMIP: ({ setting, delay }: { setting: boolean; delay?: number }) => void;
};

export type {
  LogicAnimationsContextType,
  LogicBoardStateContextType,
  LogicGameFlowContextType,
  LogicInteractionsContextType,
  LogicUIContextType,
};
