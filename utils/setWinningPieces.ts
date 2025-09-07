import { animateWinner } from "@/animations/pieceAnimations";
import { WINNER_V0_DELAY } from "@/constants/animations";
import { PieceAnimation } from "@/hooks/usePieceAnimations";
import { Team } from "@/types/board";
import { PieceProps, PieceState } from "@/types/logic";
import { BoardPiece, BoardPieces } from "./findPieceRelationships";
import setPieceState from "./setPieceState";

type SetWinningPieces = {
  partials: Pick<Record<Team, BoardPieces[]>, Team.TeamOne | Team.TeamTwo>;
  winners: Pick<Record<Team, BoardPieces[]>, Team.TeamOne | Team.TeamTwo>;
  setPieces: React.Dispatch<React.SetStateAction<Record<string, PieceProps>>>;
  animations: Record<string, PieceAnimation>;
};

export default function setWinningPieces({
  partials,
  winners,
  setPieces,
  animations,
}: SetWinningPieces) {
  const updatePieceState = (groups: BoardPieces[], pieceState: PieceState) => {
    let startDelay = WINNER_V0_DELAY;
    const pieceAnims = animations;
    groups.forEach((group) => {
      group.forEach((boardPiece: BoardPiece) => {
        console.log(group);
        setPieceState({
          id: boardPiece.pieceId,
          setPieces: setPieces,
          pieceState: pieceState,
        });
        animateWinner({
          ...pieceAnims[boardPiece.pieceId],
          startDelay,
        });

        startDelay += 100;
      });
    });
  };

  const winnersOne = winners.teamOne;
  const winnersTwo = winners.teamTwo;
  const partialsOne = partials.teamOne;
  const partialsTwo = partials.teamTwo;

  updatePieceState(winnersOne, PieceState.winner);
  updatePieceState(winnersTwo, PieceState.winner);
  updatePieceState(partialsOne, PieceState.partial);
  updatePieceState(partialsTwo, PieceState.partial);
}
