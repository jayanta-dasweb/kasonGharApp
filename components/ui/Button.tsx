import { ActivityIndicator, Pressable, Text } from 'react-native';
import { colors } from '@/constants/theme';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
};

export function Button({
  label,
  onPress,
  loading,
  variant = 'primary',
  disabled,
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
      className="min-h-[48px] items-center justify-center rounded-xl px-4"
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
        <Text className="text-base font-semibold" style={{ color: textColor }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
