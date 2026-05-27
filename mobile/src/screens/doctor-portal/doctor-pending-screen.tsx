import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth.store';
import { GlassCard } from '../../components/ui/GlassCard';
import { ScreenContainer } from '../../components/shared';
import {
  figmaColors,
  figmaFonts,
  figmaRadius,
  figmaSpacing,
} from '../../constants/theme';

export function DoctorPendingScreen() {
  const insets = useSafeAreaInsets();
  const { user, loadUser, logout } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const doctorStatus = user?.doctorStatus;
  const isRejected = doctorStatus === 'REJECTED';

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadUser();
    } finally {
      setRefreshing(false);
    }
  }, [loadUser]);

  return (
    <ScreenContainer
      refreshing={refreshing}
      onRefresh={handleRefresh}
      contentStyle={styles.content}
    >
      <LinearGradient
        colors={
          isRejected
            ? [figmaColors.error, '#B71C1C']
            : [figmaColors.primary, figmaColors.primaryDark]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + figmaSpacing.xl }]}
      >
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons
            name={isRejected ? 'close-circle-outline' : 'clock-outline'}
            size={64}
            color="#FFFFFF"
          />
        </View>
        <Text style={styles.headerTitle}>
          {isRejected ? 'Hồ sơ bị từ chối' : 'Chờ duyệt hồ sơ'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {isRejected
            ? 'Hồ sơ bác sĩ của bạn đã bị từ chối. Vui lòng liên hệ quản trị viên.'
            : 'Hồ sơ bác sĩ của bạn đang được xem xét. Bạn sẽ nhận thông báo khi được duyệt.'}
        </Text>
      </LinearGradient>

      <View style={styles.body}>
        <GlassCard style={styles.card}>
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.stepDone]} />
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Đăng ký tài khoản</Text>
              <Text style={styles.stepDesc}>Hoàn tất</Text>
            </View>
            <MaterialCommunityIcons
              name="check-circle"
              size={24}
              color={figmaColors.success}
            />
          </View>

          <View style={styles.stepLine} />

          <View style={styles.stepRow}>
            <View
              style={[
                styles.stepDot,
                isRejected ? styles.stepRejected : styles.stepActive,
              ]}
            />
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Xem xét hồ sơ</Text>
              <Text style={styles.stepDesc}>
                {isRejected ? 'Bị từ chối' : 'Đang xử lý...'}
              </Text>
            </View>
            <MaterialCommunityIcons
              name={isRejected ? 'close-circle' : 'timer-sand'}
              size={24}
              color={isRejected ? figmaColors.error : figmaColors.warning}
            />
          </View>

          <View style={styles.stepLine} />

          <View style={styles.stepRow}>
            <View style={styles.stepDot} />
            <View style={styles.stepInfo}>
              <Text style={[styles.stepTitle, styles.stepTitleMuted]}>
                Kích hoạt tài khoản
              </Text>
              <Text style={styles.stepDesc}>Chờ bước trước</Text>
            </View>
            <MaterialCommunityIcons
              name="lock-outline"
              size={24}
              color={figmaColors.textMuted}
            />
          </View>
        </GlassCard>

        <GlassCard style={styles.infoCard}>
          <MaterialCommunityIcons
            name="information-outline"
            size={22}
            color={figmaColors.primary}
          />
          <Text style={styles.infoText}>
            Kéo xuống để kiểm tra trạng thái mới nhất. Quá trình duyệt thường mất 1-2 ngày làm
            việc.
          </Text>
        </GlassCard>

        <Button
          mode="outlined"
          onPress={handleRefresh}
          loading={refreshing}
          icon="refresh"
          style={styles.refreshBtn}
          textColor={figmaColors.primary}
        >
          Kiểm tra trạng thái
        </Button>

        <Button
          mode="text"
          onPress={logout}
          icon="logout"
          textColor={figmaColors.textSecondary}
          style={styles.logoutBtn}
        >
          Đăng xuất
        </Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 100 },
  header: {
    alignItems: 'center',
    paddingBottom: figmaSpacing['3xl'],
    paddingHorizontal: figmaSpacing.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: figmaSpacing.lg,
  },
  headerTitle: {
    fontSize: figmaFonts.sizes['3xl'],
    fontWeight: figmaFonts.weights.bold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: figmaFonts.sizes.md,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: figmaSpacing.sm,
    lineHeight: 20,
    paddingHorizontal: figmaSpacing.lg,
  },
  body: {
    paddingHorizontal: figmaSpacing.xl,
    paddingTop: figmaSpacing.xl,
    gap: figmaSpacing.lg,
  },
  card: {
    padding: figmaSpacing.xl,
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.md,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: figmaColors.border,
  },
  stepDone: {
    backgroundColor: figmaColors.success,
  },
  stepActive: {
    backgroundColor: figmaColors.warning,
  },
  stepRejected: {
    backgroundColor: figmaColors.error,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.semibold,
    color: figmaColors.textPrimary,
  },
  stepTitleMuted: {
    color: figmaColors.textMuted,
  },
  stepDesc: {
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textSecondary,
    marginTop: 1,
  },
  stepLine: {
    width: 2,
    height: 20,
    backgroundColor: figmaColors.border,
    marginLeft: 5,
    marginVertical: figmaSpacing.xs,
  },
  infoCard: {
    padding: figmaSpacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: figmaSpacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textSecondary,
    lineHeight: 18,
  },
  refreshBtn: {
    borderRadius: figmaRadius.md,
    borderColor: figmaColors.primary,
  },
  logoutBtn: {
    alignSelf: 'center',
  },
});
