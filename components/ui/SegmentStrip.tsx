import type { LucideIcon } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { colors } from '@/constants/theme';

export type SegmentItem<T extends string = string> = {
  key: T;
  label: string;
  icon?: LucideIcon;
};

type Props<T extends string> = {
  items: SegmentItem<T>[];
  value: T;
  onChange: (key: T) => void;
  /** equal width when few items; otherwise scroll */
  equal?: boolean;
};

/**
 * Finger-friendly mode switcher — large tap rows, not tiny badge chips.
 * Min height 56, icon + label, horizontal scroll when many options.
 */
export function SegmentStrip<T extends string>({
  items,
  value,
  onChange,
  equal,
}: Props<T>) {
  const useEqual = equal ?? items.length <= 3;

  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 16,
        overflow: 'hidden',
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          padding: 6,
          gap: 6,
        }}
      >
        {items.map((item) => {
          const active = item.key === value;
          const Icon = item.icon;
          return (
            <Pressable
              key={item.key}
              onPress={() => onChange(item.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
              style={{
                flexGrow: useEqual ? 1 : undefined,
                flexBasis: useEqual ? 0 : undefined,
                minWidth: useEqual ? undefined : 128,
                minHeight: 56,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: active ? colors.maroon : 'transparent',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {Icon ? (
                <Icon
                  color={active ? '#fff' : colors.muted}
                  size={22}
                  strokeWidth={2.25}
                />
              ) : null}
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: active ? '#fff' : colors.ink,
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
