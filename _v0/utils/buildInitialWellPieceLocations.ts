export const buildInitialWellPieceLocations = (): Record<string, string> => {
  const map: Record<string, string> = {};
  let pieceNum = 0;

  for (let c = 9; c <= 11; c++) {
    for (let r = 9; r <= 16; r++) {
      const key = `${r}-${c}`;
      map[key] = pieceNum.toString();
      pieceNum++;
    }
  }

  for (let c = 12; c <= 14; c++) {
    for (let r = 17; r <= 24; r++) {
      const key = `${r}-${c}`;
      map[key] = pieceNum.toString();
      pieceNum++;
    }
  }

  return map;
};
