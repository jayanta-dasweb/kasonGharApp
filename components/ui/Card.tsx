import { Text, View } from 'react-native';

type Props = {
  title: string;
  value: string;
  subtitle?: string;
  accent?: 'royal' | 'muga';
};

export function KpiCard({ title, value, subtitle, accent = 'royal' }: Props) {
  return (
    <View className="mb-3 min-w-[48%] flex-1 rounded-2xl bg-white p-4 shadow-sm">
      <Text className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </Text>
      <Text
        className="mt-2 text-xl font-bold"
        style={{ color: accent === 'royal' ? '#6B1E2A' : '#D97706' }}
      >
        {value}
      </Text>
      {subtitle ? (
        <Text className="mt-1 text-xs text-slate-400">{subtitle}</Text>
      ) : null}
    </View>
  );
}
