import { Team } from "@/types/board";
import { PieceProps, PieceState } from "@/types/logic";

const totalPieces = 48;

const mockAllPieces: Record<string, PieceProps> = {};

for (let i = 0; i < totalPieces; i++) {
  mockAllPieces[i.toString()] = {
    id: i.toString(),
    team: i < 24 ? Team.TeamOne : Team.TeamTwo,
    state: PieceState.inWell,
  };
}

export default mockAllPieces;
