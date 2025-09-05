import { PieceProps, PieceState, Team } from "@/types/board";
import { Consecutives } from "./findPieceRelationships";
import setPieceState from "./setPieceState";
// type UpdatePieceState = () => {
//   groups: Pick<Record<Team, Consecutives[]>, Team.TeamOne | Team.TeamTwo>;
// };

// const updatePieceState = (group: UpdatePieceState) => {
//   group[Team.TeamOne]forEach((consecutive: Consecutives) => {
//     consecutive.forEach((boardPiece) => {
//       setPieceState({
//         id: boardPiece.id,
//         setPieces,
//         pieceState: PieceState.winner,
//       });
//     });
//   });
// };

type SetWinningPieces = {
  partials: Pick<Record<Team, Consecutives[]>, Team.TeamOne | Team.TeamTwo>;
  winners: Pick<Record<Team, Consecutives[]>, Team.TeamOne | Team.TeamTwo>;
  winNextTurns: Pick<Record<Team, string[]>, Team.TeamOne | Team.TeamTwo>;
  setPieces: React.Dispatch<React.SetStateAction<Record<string, PieceProps>>>;
};
export default function setWinningPieces({
  partials,
  winners,
  winNextTurns,
  setPieces,
}: SetWinningPieces) {
  const winnersOne = winners.teamOne;
  const winnersTwo = winners.teamTwo;
  const partialsOne = partials.teamOne;
  const partialsTwo = partials.teamTwo;

  winnersOne.forEach((group) => {
    group.forEach((boardPiece) => {
      setPieceState({
        id: boardPiece.pieceId,
        setPieces: setPieces,
        pieceState: PieceState.winner,
      });
    });
  });
}
