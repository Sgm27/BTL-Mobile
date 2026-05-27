import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Snackbar, Text, TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  figmaColors,
  figmaFonts,
  figmaRadius,
  figmaShadows,
  figmaSpacing,
} from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState('');

  const heroTranslateY = useRef(new Animated.Value(-30)).current;
  const formSlides = useRef(
    Array.from({ length: 4 }, () => new Animated.Value(40)),
  ).current;

  useEffect(() => {
    Animated.spring(heroTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 14,
    }).start();

    Animated.stagger(
      90,
      formSlides.map((slide) =>
        Animated.spring(slide, {
          toValue: 0,
          useNativeDriver: true,
          damping: 16,
        }),
      ),
    ).start();
  }, [heroTranslateY, formSlides]);

  async function handleSubmit(): Promise<void> {
    if (!email.trim()) {
      setSnack('Vui lòng nhập email.');
      return;
    }
    setSubmitting(true);
    // Placeholder API call
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSubmitting(false);
    setSnack('Tính năng đang phát triển');
  }

  function renderRow(index: number, child: React.ReactNode): React.ReactNode {
    return (
      <Animated.View
        key={index}
        style={{ transform: [{ translateY: formSlides[index] }] }}
      >
        {child}
      </Animated.View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[styles.heroContainer, { transform: [{ translateY: heroTranslateY }] }]}
        >
          <LinearGradient
            colors={[figmaColors.primary, figmaColors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, { paddingTop: insets.top + figmaSpacing.md }]}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.lottieWrapper}>
              <LottieView
                source={require('../../assets/animations/medical-hero.json')}
                autoPlay
                loop
                style={styles.lottie}
              />
            </View>
            <Text style={styles.heroTitle}>Quên mật khẩu?</Text>
            <Text style={styles.heroSubtitle}>
              Đừng lo, chúng tôi sẽ giúp bạn lấy lại
            </Text>
          </LinearGradient>
        </Animated.View>

        <View style={styles.card}>
          {renderRow(
            0,
            <Text style={styles.description}>
              Nhập email để nhận hướng dẫn đặt lại mật khẩu. Chúng tôi sẽ gửi liên kết
              khôi phục đến hộp thư của bạn.
            </Text>,
          )}

          {renderRow(
            1,
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                mode="outlined"
                placeholder="email@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                left={<TextInput.Icon icon="email-outline" />}
                style={styles.input}
                outlineColor={figmaColors.border}
                activeOutlineColor={figmaColors.primary}
                outlineStyle={styles.inputOutline}
              />
            </View>,
          )}

          {renderRow(
            2,
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={submitting}
              onPress={handleSubmit}
              style={styles.primaryButton}
            >
              <LinearGradient
                colors={[figmaColors.primary, figmaColors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonLabel}>
                  {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>,
          )}

          {renderRow(
            3,
            <View style={styles.footer}>
              <Text style={styles.footerText}>Nhớ mật khẩu rồi? </Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={styles.footerLink}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>,
          )}
        </View>
      </ScrollView>

      <Snackbar
        visible={Boolean(snack)}
        onDismiss={() => setSnack('')}
        duration={3000}
        action={{ label: 'OK', onPress: () => setSnack('') }}
      >
        {snack}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: figmaColors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: figmaSpacing['3xl'],
  },
  heroContainer: {
    overflow: 'hidden',
  },
  gradient: {
    width: SCREEN_WIDTH,
    paddingBottom: figmaSpacing['3xl'],
    paddingHorizontal: figmaSpacing.xl,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backButton: {
    position: 'absolute',
    left: figmaSpacing.lg,
    top: figmaSpacing.lg + figmaSpacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  lottieWrapper: {
    width: 140,
    height: 140,
    marginTop: figmaSpacing.md,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: figmaFonts.weights.bold,
    textAlign: 'center',
    marginTop: figmaSpacing.sm,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: figmaFonts.sizes.md,
    textAlign: 'center',
    marginTop: figmaSpacing.xs,
    fontWeight: figmaFonts.weights.medium,
  },
  card: {
    marginTop: -figmaSpacing.xl,
    marginHorizontal: figmaSpacing.xl,
    padding: figmaSpacing['2xl'],
    gap: figmaSpacing.lg,
    borderRadius: figmaRadius.xl,
    backgroundColor: figmaColors.surface,
    ...figmaShadows.pop,
  },
  description: {
    fontSize: figmaFonts.sizes.md,
    color: figmaColors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  field: {
    gap: figmaSpacing.xs,
  },
  label: {
    fontSize: figmaFonts.sizes.md,
    fontWeight: figmaFonts.weights.semibold,
    color: figmaColors.textPrimary,
    marginLeft: figmaSpacing.xs,
  },
  input: {
    backgroundColor: figmaColors.surface,
    fontSize: figmaFonts.sizes.md,
  },
  inputOutline: {
    borderRadius: figmaRadius.md,
    borderWidth: 1.5,
  },
  primaryButton: {
    borderRadius: figmaRadius.md,
    overflow: 'hidden',
    ...figmaShadows.banner,
  },
  primaryButtonGradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.bold,
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: figmaColors.textSecondary,
    fontSize: figmaFonts.sizes.md,
  },
  footerLink: {
    color: figmaColors.primary,
    fontSize: figmaFonts.sizes.md,
    fontWeight: figmaFonts.weights.bold,
  },
});
