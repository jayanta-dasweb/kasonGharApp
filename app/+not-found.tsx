import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View className="flex-1 items-center justify-center bg-cream p-6">
        <Text className="mb-3 text-xl font-bold text-royal">Screen not found</Text>
        <Link href="/">
          <Text className="text-muga">Back to home</Text>
        </Link>
      </View>
    </>
  );
}
