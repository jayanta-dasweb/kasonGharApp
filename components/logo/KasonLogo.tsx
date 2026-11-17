import { Text, View } from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '@/constants/theme';

type Props = { size?: number };

/** Ledger-House emblem with ₹ and Assamese motif accents */
export function KasonLogo({ size = 120 }: Props) {
  const s = size;
  return (
    <View className="items-center">
      <Svg width={s} height={s} viewBox="0 0 120 120">
        <Circle cx="60" cy="60" r="56" fill={colors.royal} />
        <Circle cx="60" cy="60" r="48" fill={colors.cream} />
        {/* House / ledger roof */}
        <Path d="M30 58 L60 32 L90 58 Z" fill={colors.muga} />
        <Rect x="38" y="58" width="44" height="34" rx="3" fill={colors.royal} />
        {/* Ledger lines */}
        <Path d="M46 68 H74 M46 76 H74 M46 84 H66" stroke={colors.cream} strokeWidth="2" />
        {/* ₹ symbol */}
        <SvgText
          x="60"
          y="78"
          fill={colors.muga}
          fontSize="18"
          fontWeight="700"
          textAnchor="middle"
        >
          ₹
        </SvgText>
        {/* Assamese-inspired side motifs */}
        <Path
          d="M18 60 Q22 48 26 60 Q22 72 18 60"
          fill={colors.muga}
        />
        <Path
          d="M102 60 Q98 48 94 60 Q98 72 102 60"
          fill={colors.muga}
        />
      </Svg>
      <Text className="mt-3 text-2xl font-bold text-royal">कसों घर</Text>
      <Text className="text-sm tracking-widest text-muga">KASON GHAR</Text>
    </View>
  );
}
