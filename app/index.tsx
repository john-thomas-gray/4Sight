import { Link } from "expo-router";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";


export default function Index() {
  return (
    <GestureHandlerRootView className="flex-1">
      <InnerIndexLayout />
    </GestureHandlerRootView>
  );
}

function InnerIndexLayout() {
  return (
    <View className="flex-1 border-2 border-red-50 items-center justify-evenly bg-white">
      <View className="flex-row items-end items-center">
        <Text className="text-black font-bold text-[128px] mb-4">4</Text>
        <Text className="text-black font-bold text-8xl ml-2">Sight</Text>
      </View>
      <View className="flex-col items-center space-y-4">
        <Link href="/gamePlay" className="text-3xl">
          Play
        </Link>
        <Link href="/settings" className="text-lg">
          Settings
        </Link>
        <Link href="/howToPlay" className="text-lg">
          Instructions
        </Link>
        <Link href="/testGround" className="text-lg">
          Test
        </Link>
      </View>
    </View>
  );
}
