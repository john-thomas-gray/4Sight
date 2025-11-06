import { GameElements } from "@/constants";
import { PieceAnimation } from "@/types/animation";
import { Team } from "@/types/board";
import { PieceProps } from "@/types/logic";

export type TeamWellsLayout = Record<
  string,
  { pageX: number; pageY: number; width: number; height: number }
>;

export type BuildTeamPiecesOptions = { updateAnimations?: boolean };

export type BuildTeamPiecesResult = {
  pieces: Record<string, PieceProps>;
  wellMap: Record<string, string>;
};

export const buildTeamPieces = (
  team: Team,
  startIdx: number,
  teamWells: TeamWellsLayout,
  pieceAnimations: Record<string, PieceAnimation>,
  options?: BuildTeamPiecesOptions
): BuildTeamPiecesResult => {
  const shouldUpdateAnimations = options?.updateAnimations ?? true;
  const pieces: Record<string, PieceProps> = {};
  const wellMap: Record<string, string> = {};

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
    if (layout && anim && shouldUpdateAnimations) {
      anim.translateX.value =
        layout.pageX + layout.width / 2 - GameElements.PIECE_RADIUS;
      anim.translateY.value =
        layout.pageY + layout.height / 2 - GameElements.PIECE_RADIUS;
    }
  });

  return { pieces, wellMap };
};
