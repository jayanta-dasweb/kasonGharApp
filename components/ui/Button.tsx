import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { colors } from '@/constants/theme';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  icon?: LucideIcon;
};

export function Button({
  label,
  onPress,
  loading,
  variant = 'primary',
  disabled,
  icon: Icon,
}: Props) {
  const bg =
    variant === 'primary'
      ? colors.royal
      : variant === 'secondary'
        ? colors.muga
        : variant === 'danger'
          ? colors.danger
          : 'transparent';

  const textColor = variant === 'ghost' ? colors.royal : colors.white;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="min-h-[52px] items-center justify-center rounded-xl px-4"
      style={{
        backgroundColor: bg,
        opacity: disabled || loading ? 0.6 : 1,
        borderWidth: variant === 'ghost' ? 1 : 0,
        borderColor: colors.border,
      }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {Icon ? <Icon color={textColor} size={22} strokeWidth={2.25} /> : null}
          <Text className="text-base font-semibold" style={{ color: textColor }}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
