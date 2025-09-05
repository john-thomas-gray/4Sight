import { PieceProps, PieceState } from "@/types/board";

const setPieceState = ({
  id,
  setPieces,
  pieceState,
}: {
  id: string;
  setPieces: React.Dispatch<React.SetStateAction<Record<string, PieceProps>>>;
  pieceState: PieceState;
}) => {
  setPieces((prev) => ({
    ...prev,
    [id]: {
      ...prev[id],
      pieceState,
    },
  }));
};

export default setPieceState;
