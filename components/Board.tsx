// import React from 'react';
// import { View } from 'react-native';
// import Corner from './Corner';
// import Slot from './Slot';
// import Space from './Space';

// const BOARD_SIZE = 9;

// const getOrientation = (row: number, col: number): 'N' | 'S' | 'E' | 'W' | 'NE' | 'NW' | 'SE' | 'SW' | 'C' => {
//   const last = BOARD_SIZE - 1;

//   if (row === 0 && col === 0) return 'NW';
//   if (row === 0 && col === last) return 'NE';
//   if (row === last && col === 0) return 'SW';
//   if (row === last && col === last) return 'SE';
//   if (row === 0) return 'N';
//   if (row === last) return 'S';
//   if (col === 0) return 'W';
//   if (col === last) return 'E';

//   return 'C';
// };

// const Board = ({ className }: { className?: string }) => {
//   return (
//     <View className={`flex-1 flex-col ${className}`}>
//       {Array.from({ length: BOARD_SIZE }).map((_, row) => (
//         <View key={row} style={{ flex: 1, flexDirection: 'row' }}>
//           {Array.from({ length: BOARD_SIZE }).map((_, col) => {
//             const orientation = getOrientation(row, col);

//             if (orientation === 'C') {
//               return <Space key={`${row}-${col}`} row={row} col={col} />;
//             }

//             if (['NW', 'NE', 'SW', 'SE'].includes(orientation)) {
//               return (
//                 <Corner
//                   key={`${row}-${col}`}
//                   orientation={orientation as 'NE' | 'NW' | 'SE' | 'SW'}
//                   row={row}
//                   col={col}
//                 />
//               );
//             }

//             return (
//               <Slot
//                 key={`${row}-${col}`}
//                 orientation={orientation as 'N' | 'S' | 'E' | 'W'}
//                 row={row}
//                 col={col}
//               />
//             );
//           })}
//         </View>
//       ))}
//     </View>
//   );
// };

// export default Board;
