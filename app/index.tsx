import { Link } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return <InnerIndexLayout />;
}

function InnerIndexLayout() {
  return (
    <SafeAreaView className="flex-1 border-2 border-red-50 items-center justify-evenly bg-white">
      <Text className="text-black font-bold text-8xl">FourSight</Text>
      <View className="flex-col items-center space-y-4">
        <Link href="/twoPlayer" className="text-lg">
          Two Player
        </Link>
        <Link href="/fourPlayer" className="text-lg">
          Four Player
        </Link>
        <Link href="/settings" className="text-lg">
          Settings
        </Link>
        <Link href="/howToPlay" className="text-lg">
          How to Play
        </Link>
        <Link href="/test" className="text-lg">
          Test
        </Link>
      </View>
    </SafeAreaView>
  );
}
