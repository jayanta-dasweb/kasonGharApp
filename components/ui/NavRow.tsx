import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { colors } from '@/constants/theme';

type Props = {
  label: string;
  subtitle?: string;
  icon: LucideIcon;
  onPress: () => void;
  active?: boolean;
  color?: string;
  badge?: string | number | null;
};

/** Full-width list row — easy to hit with a finger */
export function NavRow({
  label,
  subtitle,
  icon: Icon,
  onPress,
  active,
  color = colors.maroon,
  badge,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 10,
        borderRadius: 16,
        backgroundColor: active ? `${color}14` : '#fff',
        borderWidth: 1.5,
        borderColor: active ? color : colors.border,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: `${color}18`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon color={color} size={26} strokeWidth={2.25} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>{label}</Text>
        {subtitle ? (
          <Text style={{ marginTop: 2, fontSize: 12, color: colors.muted }}>{subtitle}</Text>
        ) : null}
      </View>
      {badge != null && Number(badge) > 0 ? (
        <View
          style={{
            minWidth: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: colors.danger,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 6,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{badge}</Text>
        </View>
      ) : (
        <ChevronRight color={colors.muted} size={22} />
      )}
    </Pressable>
  );
}
