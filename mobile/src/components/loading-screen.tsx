import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import {
  figmaColors,
  figmaFonts,
  figmaSpacing,
} from '../constants/theme';

export function LoadingScreen() {
  const insets = useSafeAreaInsets();

  const heroTranslateY = useRef(new Animated.Value(20)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleTranslateY = useRef(new Animated.Value(20)).current;

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.spring(heroTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 14,
      }),
      Animated.spring(titleTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 14,
      }),
      Animated.spring(subtitleTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 14,
      }),
    ]).start();

    const makeBounce = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: -8,
            duration: 360,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 360,
            useNativeDriver: true,
          }),
          Animated.delay(240),
        ]),
      );

    Animated.parallel([
      makeBounce(dot1, 0),
      makeBounce(dot2, 160),
      makeBounce(dot3, 320),
    ]).start();
  }, [heroTranslateY, titleTranslateY, subtitleTranslateY, dot1, dot2, dot3]);

  return (
    <LinearGradient
      colors={[figmaColors.primary, figmaColors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.lottieWrapper,
            { transform: [{ translateY: heroTranslateY }] },
          ]}
        >
          <LottieView
            source={require('../assets/animations/medical-hero.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
        </Animated.View>

        <Animated.View style={{ transform: [{ translateY: titleTranslateY }] }}>
          <Text style={styles.title}>BTL Healthcare</Text>
        </Animated.View>

        <Animated.View style={{ transform: [{ translateY: subtitleTranslateY }] }}>
          <Text style={styles.subtitle}>Chăm sóc sức khỏe thông minh</Text>
        </Animated.View>

        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, { transform: [{ translateY: dot1 }] }]} />
          <Animated.View style={[styles.dot, { transform: [{ translateY: dot2 }] }]} />
          <Animated.View style={[styles.dot, { transform: [{ translateY: dot3 }] }]} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: figmaSpacing.md,
  },
  lottieWrapper: {
    width: 200,
    height: 200,
    marginBottom: figmaSpacing.sm,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: figmaFonts.weights.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: figmaFonts.sizes.md,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: figmaSpacing.xs,
    fontWeight: figmaFonts.weights.medium,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: figmaSpacing.sm,
    marginTop: figmaSpacing.xl,
    height: 16,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});
