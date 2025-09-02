type xConsecutives = {
  boardPieces: Record<string, string>;
  X: number;
  initialSpace?: string;
};

const xConsecutives = ({ boardPieces, X, initialSpace }: xConsecutives) => {
  return { winners: [], almosts: [], winNextTurns: [] };
};

export default xConsecutives;
