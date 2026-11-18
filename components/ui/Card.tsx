import type { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { colors } from '@/constants/theme';

type Props = {
  title: string;
  value: string;
  subtitle?: string;
  accent?: 'royal' | 'muga';
  icon?: LucideIcon;
};

export function KpiCard({ title, value, subtitle, accent = 'royal', icon: Icon }: Props) {
  const color = accent === 'royal' ? colors.maroon : colors.muga;
  return (
    <View className="mb-3 min-w-[48%] flex-1 rounded-2xl bg-white p-4 shadow-sm">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {Icon ? (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: `${color}18`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon color={color} size={18} />
          </View>
        ) : null}
        <Text className="flex-1 text-xs font-medium uppercase tracking-wide text-slate-500">
          {title}
        </Text>
      </View>
      <Text className="mt-2 text-xl font-bold" style={{ color }}>
        {value}
      </Text>
      {subtitle ? (
        <Text className="mt-1 text-xs text-slate-400">{subtitle}</Text>
      ) : null}
    </View>
  );
}
