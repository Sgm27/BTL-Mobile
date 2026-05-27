import { useEffect, useRef, useState } from 'react';
import {
  Alert,
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
import { useAuthStore } from '../../store/auth.store';
import {
  figmaColors,
  figmaFonts,
  figmaRadius,
  figmaShadows,
  figmaSpacing,
} from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { error?: { message?: string } } } })
      .response;
    return response?.data?.error?.message ?? 'Đăng nhập thất bại. Vui lòng thử lại.';
  }
  return 'Đăng nhập thất bại. Vui lòng thử lại.';
}

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('patient1@gmail.com');
  const [password, setPassword] = useState('password123');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const heroTranslateY = useRef(new Animated.Value(-30)).current;
  const formSlides = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(40)),
  ).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

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

  async function handleLogin(): Promise<void> {
    if (!email.trim() || !password) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await login(email.trim(), password);
      router.replace('/home');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function handleButtonPressIn() {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  }

  function handleButtonPressOut() {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 10,
    }).start();
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
            style={[styles.gradient, { paddingTop: insets.top + figmaSpacing['2xl'] }]}
          >
            {/* ECG heartbeat line background */}
            <View style={styles.ecgContainer}>
              <LottieView
                source={require('../../assets/animations/medical-hero.json')}
                autoPlay
                loop
                style={styles.ecgAnimation}
              />
            </View>

            {/* Heart icon overlay */}
            <View style={styles.heartCircle}>
              <MaterialCommunityIcons name="heart-pulse" size={48} color="#fff" />
            </View>

            <Text style={styles.heroTitle}>BTL Healthcare</Text>
            <Text style={styles.heroSubtitle}>Chăm sóc sức khỏe thông minh</Text>
            <Text style={styles.heroCaption}>Đăng nhập để tiếp tục</Text>
          </LinearGradient>
        </Animated.View>

        <View style={styles.card}>
          {renderRow(
            0,
            <View style={styles.field}>
              <Text style={styles.label}>Email hoặc số điện thoại</Text>
              <TextInput
                mode="outlined"
                placeholder="vd: patient1@gmail.com"
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
            1,
            <View style={styles.field}>
              <Text style={styles.label}>Mật khẩu</Text>
              <TextInput
                mode="outlined"
                placeholder="Nhập mật khẩu"
                secureTextEntry={secureTextEntry}
                value={password}
                onChangeText={setPassword}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={secureTextEntry ? 'eye-off-outline' : 'eye-outline'}
                    onPress={() => setSecureTextEntry((v) => !v)}
                  />
                }
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
              style={styles.forgotWrap}
              onPress={() => router.push('/forgot-password')}
            >
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>,
          )}

          {renderRow(
            3,
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                activeOpacity={0.9}
                disabled={submitting}
                onPress={handleLogin}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                style={styles.primaryButton}
              >
                <LinearGradient
                  colors={[figmaColors.primary, figmaColors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButtonGradient}
                >
                  <Text style={styles.primaryButtonLabel}>
                    {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>,
          )}

          {renderRow(
            4,
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>hoặc</Text>
              <View style={styles.dividerLine} />
            </View>,
          )}

          {renderRow(
            5,
            <View style={styles.bottomGroup}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.googleButton}
                onPress={() =>
                  Alert.alert(
                    'Đăng nhập với Google',
                    'Tính năng đang được phát triển. Vui lòng quay lại sau.',
                    [{ text: 'Đã hiểu' }],
                  )
                }
              >
                <MaterialCommunityIcons name="google" size={20} color="#DB4437" />
                <Text style={styles.googleButtonLabel}>Đăng nhập với Google</Text>
              </TouchableOpacity>

              <View style={styles.demoHint}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={14}
                  color={figmaColors.textMuted}
                />
                <Text style={styles.demoText}>
                  Demo: patient1@gmail.com / password123
                </Text>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Chưa có tài khoản? </Text>
                <TouchableOpacity onPress={() => router.push('/register')}>
                  <Text style={styles.footerLink}>Đăng ký</Text>
                </TouchableOpacity>
              </View>
            </View>,
          )}
        </View>
      </ScrollView>

      <Snackbar
        visible={Boolean(error)}
        onDismiss={() => setError('')}
        duration={4000}
        action={{ label: 'OK', onPress: () => setError('') }}
        style={styles.snackbar}
      >
        {error}
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
    paddingBottom: figmaSpacing['3xl'] + figmaSpacing['2xl'],
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  ecgContainer: {
    width: SCREEN_WIDTH,
    height: 180,
    overflow: 'hidden',
    opacity: 0.25,
    marginBottom: -20,
  },
  ecgAnimation: {
    width: SCREEN_WIDTH * 1.2,
    height: 180,
    alignSelf: 'center',
  },
  heartCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: figmaSpacing.lg,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: figmaFonts.weights.bold,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: figmaFonts.sizes.lg,
    textAlign: 'center',
    marginTop: figmaSpacing.xs,
    fontWeight: figmaFonts.weights.medium,
  },
  heroCaption: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: figmaFonts.sizes.sm,
    textAlign: 'center',
    marginTop: figmaSpacing.xs,
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
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: -figmaSpacing.sm,
  },
  forgotText: {
    color: figmaColors.primary,
    fontSize: figmaFonts.sizes.md,
    fontWeight: figmaFonts.weights.semibold,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: figmaColors.border,
  },
  dividerText: {
    color: figmaColors.textMuted,
    fontSize: figmaFonts.sizes.sm,
    fontWeight: figmaFonts.weights.medium,
  },
  bottomGroup: {
    gap: figmaSpacing.lg,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: figmaSpacing.sm,
    height: 52,
    borderRadius: figmaRadius.md,
    borderWidth: 1.5,
    borderColor: figmaColors.border,
    backgroundColor: figmaColors.surface,
  },
  googleButtonLabel: {
    color: figmaColors.textPrimary,
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.semibold,
  },
  demoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.xs,
    justifyContent: 'center',
  },
  demoText: {
    color: figmaColors.textMuted,
    fontSize: figmaFonts.sizes.sm,
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
  snackbar: {
    backgroundColor: figmaColors.error,
  },
});
