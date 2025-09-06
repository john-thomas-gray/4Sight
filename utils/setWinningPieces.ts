import { WINNER_STATE_DELAY } from "@/constants/animations";
import { Team } from "@/types/board";
import { PieceProps, PieceState } from "@/types/logic";
import { BoardPiece, BoardPieces } from "./findPieceRelationships";
import setPieceState from "./setPieceState";

type SetWinningPieces = {
  partials: Pick<Record<Team, BoardPieces[]>, Team.TeamOne | Team.TeamTwo>;
  winners: Pick<Record<Team, BoardPieces[]>, Team.TeamOne | Team.TeamTwo>;
  setPieces: React.Dispatch<React.SetStateAction<Record<string, PieceProps>>>;
};

export default function setWinningPieces({
  partials,
  winners,
  setPieces,
}: SetWinningPieces) {
  const updatePieceState = (groups: BoardPieces[], pieceState: PieceState) => {
    let delay = WINNER_STATE_DELAY;
    groups.forEach((group) => {
      group.forEach((boardPiece: BoardPiece) => {
        setTimeout(
          () =>
            setPieceState({
              id: boardPiece.pieceId,
              setPieces: setPieces,
              pieceState: pieceState,
            }),
          delay
        );
        delay += WINNER_STATE_DELAY;
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
