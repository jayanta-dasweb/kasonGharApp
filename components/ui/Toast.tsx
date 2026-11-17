import { Text, View } from 'react-native';

type Props = {
  message: string | null;
  type?: 'error' | 'success';
};

export function Toast({ message, type = 'error' }: Props) {
  if (!message) return null;
  return (
    <View
      className="mb-3 rounded-xl px-3 py-3"
      style={{
        backgroundColor: type === 'error' ? '#FEE2E2' : '#D1FAE5',
      }}
    >
      <Text
        className="text-sm font-medium"
        style={{ color: type === 'error' ? '#DC2626' : '#059669' }}
      >
        {message}
      </Text>
    </View>
  );
}
