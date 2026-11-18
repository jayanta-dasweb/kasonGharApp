import { Image, View } from 'react-native';

type Props = {
  size?: number;
};

/** Official Kason Ghar circular brand mark */
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
        accessibilityLabel="Kason Ghar — Traditional Assamese Weaves"
      />
    </View>
  );
}
