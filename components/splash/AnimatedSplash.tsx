import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { KasonLogo } from '@/components/logo/KasonLogo';
import { brand } from '@/constants/brand';
import { colors } from '@/constants/theme';

type Props = {
  onFinished?: () => void;
};

export function AnimatedSplash({ onFinished }: Props) {
  const ringScale = useSharedValue(0.72);
  const ringOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.55);
  const logoOpacity = useSharedValue(0);
  const logoRotate = useSharedValue(-8);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(14);
  const pulse = useSharedValue(1);

  useEffect(() => {
    ringOpacity.value = withTiming(1, { duration: 280 });
    ringScale.value = withTiming(1, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });

    logoOpacity.value = withDelay(120, withTiming(1, { duration: 360 }));
    logoScale.value = withDelay(
      120,
      withTiming(1, { duration: 560, easing: Easing.out(Easing.back(1.4)) })
    );
    logoRotate.value = withDelay(
      120,
      withTiming(0, { duration: 560, easing: Easing.out(Easing.cubic) })
    );

    titleOpacity.value = withDelay(420, withTiming(1, { duration: 320 }));
    titleY.value = withDelay(
      420,
      withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) })
    );

    pulse.value = withDelay(
      700,
      withSequence(
        withTiming(1.04, { duration: 420 }),
        withTiming(1, { duration: 420 })
      )
    );

    const done = setTimeout(() => onFinished?.(), 1400);
    return () => clearTimeout(done);
  }, [logoOpacity, logoRotate, logoScale, onFinished, pulse, ringOpacity, ringScale, titleOpacity, titleY]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value * pulse.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  return (
    <View style={styles.root}>
      <View style={styles.glow} />
      <Animated.View style={[styles.ring, ringStyle]}>
        <Animated.View style={logoStyle}>
          <KasonLogo size={220} />
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.copy, titleStyle]}>
        <Text style={styles.brandAssamese}>{brand.nameAs}</Text>
        <Text style={styles.brandEn}>{brand.nameEn}</Text>
        <Text style={styles.tagline}>{brand.taglineEn}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
    paddingHorizontal: 24,
  },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(107, 30, 42, 0.06)',
  },
  ring: {
    padding: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(107, 30, 42, 0.22)',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  copy: {
    marginTop: 28,
    alignItems: 'center',
  },
  brandAssamese: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.maroon,
    letterSpacing: 0, // letterSpacing breaks Assamese matras (া)
  },
  brandEn: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    color: colors.maroonSoft,
  },
  tagline: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: colors.maroonSoft,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
