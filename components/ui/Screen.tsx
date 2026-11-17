import { ReactNode } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';

type Props = {
  title: string;
  children: ReactNode;
  loading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  right?: ReactNode;
};

export function Screen({
  title,
  children,
  loading,
  onRefresh,
  refreshing,
  right,
}: Props) {
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 pb-2 pt-2">
        <Text className="text-2xl font-bold text-royal">{title}</Text>
        {right}
      </View>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.royal} />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={colors.royal}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
