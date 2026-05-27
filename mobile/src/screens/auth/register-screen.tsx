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

type Role = 'PATIENT' | 'DOCTOR';

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { error?: { message?: string } } } })
      .response;
    return response?.data?.error?.message ?? 'Đăng ký thất bại. Vui lòng thử lại.';
  }
  return 'Đăng ký thất bại. Vui lòng thử lại.';
}

interface RoleCardProps {
  label: string;
  description: string;
  icon: 'account-heart' | 'stethoscope';
  active: boolean;
  onPress: () => void;
}

function RoleCard({ label, description, icon, active, onPress }: RoleCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: active ? 1.04 : 1,
      useNativeDriver: true,
      damping: 12,
    }).start();
  }, [active, scale]);

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={{ flex: 1 }}>
      <Animated.View
        style={[
          styles.roleCard,
          active && styles.roleCardActive,
          { transform: [{ scale }] },
        ]}
      >
        <View style={[styles.roleIconWrap, active && styles.roleIconWrapActive]}>
          <MaterialCommunityIcons
            name={icon}
            size={28}
            color={active ? '#FFFFFF' : figmaColors.primary}
          />
        </View>
        <Text style={[styles.roleLabel, active && styles.roleLabelActive]}>{label}</Text>
        <Text style={[styles.roleDescription, active && styles.roleDescriptionActive]}>
          {description}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const register = useAuthStore((state) => state.register);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('PATIENT');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const heroTranslateY = useRef(new Animated.Value(-30)).current;
  const formSlides = useRef(
    Array.from({ length: 9 }, () => new Animated.Value(40)),
  ).current;

  useEffect(() => {
    Animated.spring(heroTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 14,
    }).start();

    Animated.stagger(
      70,
      formSlides.map((slide) =>
        Animated.spring(slide, {
          toValue: 0,
          useNativeDriver: true,
          damping: 16,
        }),
      ),
    ).start();
  }, [heroTranslateY, formSlides]);

  async function handleRegister(): Promise<void> {
    if (!name.trim() || !email.trim() || !password) {
      setError('Vui lòng nhập đầy đủ họ tên, email và mật khẩu.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (!acceptTerms) {
      setError('Vui lòng đồng ý với Điều khoản và Chính sách.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      router.replace('/home');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
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
            <Text style={styles.heroTitle}>Tạo tài khoản mới</Text>
            <Text style={styles.heroSubtitle}>Đăng ký để bắt đầu</Text>
          </LinearGradient>
        </Animated.View>

        <View style={styles.card}>
          {renderRow(
            0,
            <View style={styles.field}>
              <Text style={styles.label}>Bạn là</Text>
              <View style={styles.roleRow}>
                <RoleCard
                  label="Bệnh nhân"
                  description="Đặt lịch khám bệnh"
                  icon="account-heart"
                  active={role === 'PATIENT'}
                  onPress={() => setRole('PATIENT')}
                />
                <RoleCard
                  label="Bác sĩ"
                  description="Quản lý lịch khám"
                  icon="stethoscope"
                  active={role === 'DOCTOR'}
                  onPress={() => setRole('DOCTOR')}
                />
              </View>
            </View>,
          )}

          {renderRow(
            1,
            <View style={styles.field}>
              <Text style={styles.label}>Họ và tên</Text>
              <TextInput
                mode="outlined"
                placeholder="Nguyễn Văn A"
                value={name}
                onChangeText={setName}
                left={<TextInput.Icon icon="account-outline" />}
                style={styles.input}
                outlineColor={figmaColors.border}
                activeOutlineColor={figmaColors.primary}
                outlineStyle={styles.inputOutline}
              />
            </View>,
          )}

          {renderRow(
            2,
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
            3,
            <View style={styles.field}>
              <Text style={styles.label}>Số điện thoại</Text>
              <TextInput
                mode="outlined"
                placeholder="0912 345 678"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                left={<TextInput.Icon icon="phone-outline" />}
                style={styles.input}
                outlineColor={figmaColors.border}
                activeOutlineColor={figmaColors.primary}
                outlineStyle={styles.inputOutline}
              />
            </View>,
          )}

          {renderRow(
            4,
            <View style={styles.field}>
              <Text style={styles.label}>Mật khẩu</Text>
              <TextInput
                mode="outlined"
                placeholder="Tối thiểu 8 ký tự"
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
            5,
            <View style={styles.field}>
              <Text style={styles.label}>Xác nhận mật khẩu</Text>
              <TextInput
                mode="outlined"
                placeholder="Nhập lại mật khẩu"
                secureTextEntry={secureConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                left={<TextInput.Icon icon="lock-check-outline" />}
                right={
                  <TextInput.Icon
                    icon={secureConfirm ? 'eye-off-outline' : 'eye-outline'}
                    onPress={() => setSecureConfirm((v) => !v)}
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
            6,
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.checkboxRow}
              onPress={() => setAcceptTerms((v) => !v)}
            >
              <View style={[styles.checkbox, acceptTerms && styles.checkboxActive]}>
                {acceptTerms && (
                  <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>
                Tôi đồng ý với{' '}
                <Text style={styles.checkboxLink}>Điều khoản</Text>
                {' và '}
                <Text style={styles.checkboxLink}>Chính sách</Text>
              </Text>
            </TouchableOpacity>,
          )}

          {renderRow(
            7,
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={submitting}
              onPress={handleRegister}
              style={styles.primaryButton}
            >
              <LinearGradient
                colors={[figmaColors.primary, figmaColors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonLabel}>
                  {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>,
          )}

          {renderRow(
            8,
            <View style={styles.footer}>
              <Text style={styles.footerText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.footerLink}>Đăng nhập</Text>
              </TouchableOpacity>
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
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: figmaFonts.weights.bold,
    textAlign: 'center',
    marginTop: figmaSpacing.lg,
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
  roleRow: {
    flexDirection: 'row',
    gap: figmaSpacing.md,
    marginTop: figmaSpacing.xs,
  },
  roleCard: {
    alignItems: 'center',
    padding: figmaSpacing.lg,
    borderRadius: figmaRadius.lg,
    borderWidth: 1.5,
    borderColor: figmaColors.border,
    backgroundColor: figmaColors.surface,
    gap: figmaSpacing.sm,
  },
  roleCardActive: {
    borderColor: figmaColors.primary,
    backgroundColor: figmaColors.pastelBlue,
  },
  roleIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: figmaColors.pastelBlue,
  },
  roleIconWrapActive: {
    backgroundColor: figmaColors.primary,
  },
  roleLabel: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textPrimary,
  },
  roleLabelActive: {
    color: figmaColors.primary,
  },
  roleDescription: {
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textSecondary,
    textAlign: 'center',
  },
  roleDescriptionActive: {
    color: figmaColors.primary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: figmaSpacing.sm,
    paddingVertical: figmaSpacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: figmaColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: figmaColors.surface,
    marginTop: 1,
  },
  checkboxActive: {
    borderColor: figmaColors.primary,
    backgroundColor: figmaColors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: figmaFonts.sizes.md,
    color: figmaColors.textSecondary,
    lineHeight: 20,
  },
  checkboxLink: {
    color: figmaColors.primary,
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
