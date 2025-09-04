import { CellLayout, PieceProps } from "@/types/board";

const animateGravity = ({
  boardPieceLocations,
  spaces,
  pieces,
}: {
  boardPieceLocations: Record<string, string>;
  spaces: Record<string, CellLayout>;
  pieces: Record<string, PieceProps>;
}) => {
  "worklet";
  console.log("bpl:", boardPieceLocations);
  Object.entries(boardPieceLocations).forEach(([spaceId, pieceId]) => {
    const spaceLayout = spaces[spaceId];
    const piece = pieces[pieceId];
  });

  // 'AnimateGravity': pieceIdIn, boardPieceLocations, spaces, translateX, translateY
  // const nextSpaceId = Object.entries(boardPieceLocations).find(
  //   ([spaceId, pieceId]) => pieceId === pieceIdIn
  // )?.[0];
  // count++;
  // console.log("every time", count);

  // if (nextSpaceId && spaces[nextSpaceId]) {
  //   const nextSpaceLayout = spaces[nextSpaceId];
  //   translateX.value = withTiming(
  //     nextSpaceLayout.pageX +
  //       nextSpaceLayout.width / 2 -
  //       GameElements.PIECE_RADIUS,
  //     {
  //       duration: Animations.SLOT_TO_SPACE_DURATION,
  //       easing: Easing.bounce,
  //     }
  //   );
  //   translateY.value = withTiming(
  //     nextSpaceLayout.pageY +
  //       nextSpaceLayout.height / 2 -
  //       GameElements.PIECE_RADIUS,
  //     {
  //       duration: Animations.SLOT_TO_SPACE_DURATION,
  //       easing: Easing.bounce,
  //     }
  //   );
  // }
};
export default animateGravity;
