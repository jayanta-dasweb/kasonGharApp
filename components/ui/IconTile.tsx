import type { LucideIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { colors } from '@/constants/theme';

type Props = {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  active?: boolean;
  color?: string;
  badge?: string | number | null;
  size?: 'sm' | 'md' | 'lg';
};

/** Large picture+word tile for low-literacy navigation */
export function IconTile({
  label,
  icon: Icon,
  onPress,
  active,
  color = colors.maroon,
  badge,
  size = 'md',
}: Props) {
  const box = size === 'lg' ? 72 : size === 'sm' ? 44 : 56;
  const iconSize = size === 'lg' ? 34 : size === 'sm' ? 22 : 28;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: size === 'lg' ? '47%' : size === 'sm' ? undefined : '31%',
        minWidth: size === 'sm' ? 72 : undefined,
        alignItems: 'center',
        backgroundColor: active ? color : '#fff',
        borderRadius: 18,
        paddingVertical: size === 'sm' ? 10 : 14,
        paddingHorizontal: 8,
        marginBottom: 8,
        borderWidth: 1.5,
        borderColor: active ? color : colors.border,
      }}
    >
      <View
        style={{
          width: box,
          height: box,
          borderRadius: box / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? 'rgba(255,255,255,0.22)' : `${color}18`,
        }}
      >
        <Icon color={active ? '#fff' : color} size={iconSize} strokeWidth={2.25} />
        {badge != null && Number(badge) > 0 ? (
          <View
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              minWidth: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: colors.danger,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text
        numberOfLines={2}
        style={{
          marginTop: 8,
          textAlign: 'center',
          fontSize: size === 'sm' ? 11 : 12,
          fontWeight: '700',
          color: active ? '#fff' : colors.ink,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
