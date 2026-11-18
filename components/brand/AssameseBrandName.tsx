import { Text, type TextStyle, View } from 'react-native';
import { brand } from '@/constants/brand';
import { colors } from '@/constants/theme';

type Props = {
  size?: number;
  color?: string;
  style?: TextStyle;
  showEnglish?: boolean;
};

/**
 * Renders কাছন ঘৰ in separate Text nodes so Android fonts
 * cannot drop the আ matra or ঘৰ as one broken glyph run.
 */
export function AssameseBrandName({
  size = 28,
  color = colors.maroon,
  style,
  showEnglish = true,
}: Props) {
  const { ka, son, ghar } = brand.nameAsParts;
  return (
    <View style={{ alignItems: 'center' }}>
      <Text
        style={[
          {
            fontSize: size,
            fontWeight: '700',
            color,
            letterSpacing: 0,
            includeFontPadding: false,
          },
          style,
        ]}
      >
        <Text style={{ letterSpacing: 0 }}>{ka}</Text>
        <Text style={{ letterSpacing: 0 }}>{son}</Text>
        <Text style={{ letterSpacing: 0 }}> </Text>
        <Text style={{ letterSpacing: 0 }}>{ghar}</Text>
      </Text>
      {showEnglish ? (
        <Text
          style={{
            marginTop: 4,
            fontSize: Math.max(14, size * 0.55),
            fontWeight: '700',
            color: colors.maroonSoft,
          }}
        >
          {brand.nameEn}
        </Text>
      ) : null}
    </View>
  );
}
