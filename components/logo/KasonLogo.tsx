import { Image, View } from 'react-native';
import { brand } from '@/constants/brand';

type Props = {
  size?: number;
};

/** Official কছন ঘৰ circular brand mark */
export function KasonLogo({ size = 180 }: Props) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        backgroundColor: '#F7F1E8',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        source={require('../../assets/images/kason-ghar-logo.jpg')}
        style={{ width: size, height: size }}
        resizeMode="cover"
        accessibilityLabel={brand.a11yLogo}
      />
    </View>
  );
}
