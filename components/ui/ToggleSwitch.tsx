import { Pressable, Text, View } from 'react-native';
import { colors } from '@/constants/theme';

type Props = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  /** Label when OFF (left) */
  offLabel: string;
  /** Label when ON (right) */
  onLabel: string;
  disabled?: boolean;
};

/**
 * Large two-sided toggle — clearer than tiny chips for confused users.
 * Tap either side or the track to flip.
 */
export function ToggleSwitch({
  value,
  onValueChange,
  offLabel,
  onLabel,
  disabled,
}: Props) {
  return (
    <View
      style={{
        marginBottom: 16,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: '#fff',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 6,
          minHeight: 60,
        }}
      >
        <Pressable
          disabled={disabled}
          onPress={() => onValueChange(false)}
          accessibilityRole="button"
          accessibilityState={{ selected: !value }}
          style={{
            flex: 1,
            minHeight: 48,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: !value ? colors.maroon : 'transparent',
            paddingHorizontal: 10,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: 15,
              fontWeight: '800',
              color: !value ? '#fff' : colors.muted,
            }}
          >
            {offLabel}
          </Text>
        </Pressable>
        <Pressable
          disabled={disabled}
          onPress={() => onValueChange(true)}
          accessibilityRole="button"
          accessibilityState={{ selected: value }}
          style={{
            flex: 1,
            minHeight: 48,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: value ? colors.maroon : 'transparent',
            paddingHorizontal: 10,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: 15,
              fontWeight: '800',
              color: value ? '#fff' : colors.muted,
            }}
          >
            {onLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

type RowProps = {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  /** Tighter row for permission matrices / nested lists */
  dense?: boolean;
};

/** Single-row Active/On switch with big tap target */
export function ToggleRow({
  label,
  hint,
  value,
  onValueChange,
  disabled,
  dense,
}: RowProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      style={{
        minHeight: dense ? 52 : 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: dense ? (value ? '#ECFDF5' : '#F8FAFC') : '#fff',
        borderRadius: dense ? 12 : 14,
        borderWidth: dense ? 0 : 1,
        borderColor: colors.border,
        paddingHorizontal: dense ? 10 : 14,
        paddingVertical: dense ? 8 : 10,
        marginBottom: dense ? 6 : 12,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text
          style={{
            fontSize: dense ? 13 : 15,
            fontWeight: '700',
            color: colors.ink,
          }}
        >
          {label}
        </Text>
        {hint ? (
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
            {hint}
          </Text>
        ) : null}
      </View>
      <View
        style={{
          width: dense ? 50 : 56,
          height: dense ? 30 : 34,
          borderRadius: 17,
          padding: 3,
          backgroundColor: value ? colors.success : '#CBD5E1',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: dense ? 24 : 28,
            height: dense ? 24 : 28,
            borderRadius: 14,
            backgroundColor: '#fff',
            alignSelf: value ? 'flex-end' : 'flex-start',
          }}
        />
      </View>
    </Pressable>
  );
}
