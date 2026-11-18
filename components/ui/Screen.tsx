import { ReactNode } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { colors } from '@/constants/theme';

type Props = {
  title?: string;
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
    <View className="flex-1 bg-cream">
      {title ? (
        <View className="flex-row items-center justify-between px-4 pb-2 pt-2">
          <Text className="text-2xl font-bold" style={{ color: colors.maroon }}>
            {title}
          </Text>
          {right}
        </View>
      ) : null}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.maroon} />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 40, paddingTop: title ? 0 : 8 }}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={colors.maroon}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      )}
    </View>
  );
}
