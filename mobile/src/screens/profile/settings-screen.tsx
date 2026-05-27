import { useCallback, useState } from 'react';
import { Alert, Linking, StyleSheet, Switch, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Application from 'expo-application';

type MCIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
import { GlassCard } from '../../components/ui/GlassCard';
import {
  FadeInView,
  GradientHeader,
  ListRow,
  ScreenContainer,
  SectionTitle,
} from '../../components/shared';
import { figmaColors, figmaFonts, figmaRadius, figmaSpacing, useColors } from '../../constants/theme';
import { useThemeStore } from '../../store/theme.store';

// ---------------------------------------------------------------------------
// Settings row with a toggle switch
// ---------------------------------------------------------------------------

interface ToggleRowProps {
  icon: MCIconName;
  iconBgColor: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}

function ToggleRow({ icon, iconBgColor, iconColor = figmaColors.primary, title, subtitle, value, onToggle }: ToggleRowProps) {
  return (
    <View style={styles.toggleRow}>
      <View style={[styles.toggleIcon, { backgroundColor: iconBgColor }]}>
        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.toggleContent}>
        <Text style={styles.toggleTitle}>{title}</Text>
        {subtitle ? <Text style={styles.toggleSub}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: figmaColors.border, true: figmaColors.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function SettingsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [appointmentReminder, setAppointmentReminder] = useState(true);
  const [medicineReminder, setMedicineReminder] = useState(true);
  const isDark = useThemeStore((s) => s.isDark);
  const toggleDark = useThemeStore((s) => s.toggle);
  const colors = useColors();

  const showTutorial = useCallback(() => {
    Alert.alert(
      'Hướng dẫn sử dụng',
      '• Đặt lịch: Chọn chuyên khoa → Phòng khám → Ngày giờ → Xác nhận\n\n'
      + '• Chat AI: Mô tả triệu chứng để nhận gợi ý chuyên khoa\n\n'
      + '• Theo dõi sức khỏe: Ghi nhận chỉ số hàng ngày\n\n'
      + '• Quét đơn thuốc: Chụp ảnh toa thuốc để lưu trữ',
      [{ text: 'Đã hiểu' }],
    );
  }, []);

  const showTerms = useCallback(() => {
    Alert.alert(
      'Điều khoản sử dụng',
      '• Ứng dụng được phát triển phục vụ mục đích học tập\n\n'
      + '• Đây là đồ án môn học tại Học viện Công nghệ Bưu chính Viễn thông (PTIT)\n\n'
      + '• Nhóm 02, Lớp 07, GV: ThS. Nguyễn Hoàng Anh\n\n'
      + '• Không sử dụng cho mục đích y khoa thực tế',
      [{ text: 'Đã hiểu' }],
    );
  }, []);

  const showPrivacyPolicy = useCallback(() => {
    Alert.alert(
      'Chính sách bảo mật',
      '• Dữ liệu được lưu trữ an toàn trên hệ thống\n\n'
      + '• Thông tin cá nhân không được chia sẻ cho bên thứ ba\n\n'
      + '• Dữ liệu sức khỏe chỉ hiển thị cho người dùng và bác sĩ điều trị\n\n'
      + '• Đây là môi trường demo, không lưu trữ dữ liệu y tế thật',
      [{ text: 'Đã hiểu' }],
    );
  }, []);

  const appVersion = Application.nativeApplicationVersion ?? '1.0.0';
  const buildVersion = Application.nativeBuildVersion ?? '1';

  return (
    <ScreenContainer showsVerticalScrollIndicator={false}>
      <GradientHeader
        title="Cài đặt"
        showBack
        subtitle="Tùy chỉnh ứng dụng theo sở thích"
        colors={[colors.primary, colors.primaryDark]}
      />

      <View style={styles.body}>
        {/* Thông báo */}
        <FadeInView delay={80}>
          <SectionTitle title="Thông báo" />
          <GlassCard style={styles.card}>
            <ToggleRow
              icon="bell-ring-outline"
              iconBgColor={figmaColors.pastelPurple}
              iconColor="#7C4DFF"
              title="Nhận thông báo đẩy"
              subtitle="Nhận thông báo trên thiết bị"
              value={pushEnabled}
              onToggle={setPushEnabled}
            />
            <View style={styles.divider} />
            <ToggleRow
              icon="calendar-clock-outline"
              iconBgColor={figmaColors.pastelBlue}
              title="Nhắc lịch hẹn"
              subtitle="Nhắc trước 1 giờ khi có lịch khám"
              value={appointmentReminder}
              onToggle={setAppointmentReminder}
            />
            <View style={styles.divider} />
            <ToggleRow
              icon="pill"
              iconBgColor={figmaColors.pastelGreen}
              iconColor={figmaColors.success}
              title="Nhắc uống thuốc"
              subtitle="Nhắc theo toa thuốc đã lưu"
              value={medicineReminder}
              onToggle={setMedicineReminder}
            />
          </GlassCard>
        </FadeInView>

        {/* Giao diện */}
        <FadeInView delay={160}>
          <SectionTitle title="Giao diện" />
          <GlassCard style={styles.card}>
            <ToggleRow
              icon="weather-night"
              iconBgColor={figmaColors.pastelTeal}
              iconColor={figmaColors.info}
              title="Chế độ tối"
              subtitle="Giao diện tối cho ban đêm"
              value={isDark}
              onToggle={toggleDark}
            />
            <View style={styles.divider} />
            <ListRow
              icon="translate"
              iconBgColor={figmaColors.pastelOrange}
              iconColor="#F57C00"
              title="Ngôn ngữ"
              subtitle="Tiếng Việt"
              onPress={() => Alert.alert(
                'Ngôn ngữ',
                'Hiện tại ứng dụng chỉ hỗ trợ Tiếng Việt. Các ngôn ngữ khác sẽ được bổ sung sau.',
                [{ text: 'Đã hiểu' }],
              )}
            />
          </GlassCard>
        </FadeInView>

        {/* Hỗ trợ */}
        <FadeInView delay={240}>
          <SectionTitle title="Hỗ trợ" />
          <GlassCard style={styles.card}>
            <ListRow
              icon="book-open-outline"
              iconBgColor={figmaColors.pastelBlue}
              title="Hướng dẫn sử dụng"
              subtitle="Cách sử dụng ứng dụng"
              onPress={showTutorial}
            />
            <View style={styles.divider} />
            <ListRow
              icon="file-document-outline"
              iconBgColor={figmaColors.surfaceMuted}
              iconColor={figmaColors.textSecondary}
              title="Điều khoản sử dụng"
              onPress={showTerms}
            />
            <View style={styles.divider} />
            <ListRow
              icon="shield-lock-outline"
              iconBgColor={figmaColors.surfaceMuted}
              iconColor={figmaColors.textSecondary}
              title="Chính sách bảo mật"
              onPress={showPrivacyPolicy}
            />
            <View style={styles.divider} />
            <ListRow
              icon="message-text-outline"
              iconBgColor={figmaColors.pastelGreen}
              iconColor={figmaColors.success}
              title="Liên hệ hỗ trợ"
              subtitle="hotro@btlhealthcare.vn"
              onPress={() => Linking.openURL('mailto:hotro@btlhealthcare.vn')}
            />
          </GlassCard>
        </FadeInView>

        {/* Thông tin ứng dụng */}
        <FadeInView delay={400}>
          <GlassCard style={[styles.card, styles.appInfoCard]}>
            <Text style={styles.appName}>BTL Healthcare</Text>
            <Text style={styles.appVersion}>
              Phiên bản {appVersion} ({buildVersion})
            </Text>
            <Text style={styles.appCopyright}>
              © 2026 Nhóm 02 — PTIT
            </Text>
            <Text style={styles.appTeam}>
              Nguyễn Thị Tú Anh · Ngô Đức Sơn · Lê Đức Hiểu · Nguyễn Trung Kiên
            </Text>
          </GlassCard>
        </FadeInView>
      </View>
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  body: {
    marginTop: figmaSpacing.xl,
    gap: figmaSpacing.lg,
    paddingBottom: figmaSpacing['3xl'],
  },
  card: {
    marginHorizontal: figmaSpacing.lg,
    paddingVertical: figmaSpacing.xs,
    paddingHorizontal: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: figmaColors.border,
    marginLeft: 68,
  },

  /* Toggle row */
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: figmaRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleIconText: {
    fontSize: 20,
  },
  toggleContent: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.medium,
    color: figmaColors.textPrimary,
  },
  toggleSub: {
    fontSize: figmaFonts.sizes.base,
    color: figmaColors.textSecondary,
  },

  /* App info */
  appInfoCard: {
    marginTop: figmaSpacing.sm,
    paddingVertical: figmaSpacing.xl,
    paddingHorizontal: figmaSpacing.lg,
    alignItems: 'center',
  },
  appName: {
    fontSize: figmaFonts.sizes.xl,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.primary,
  },
  appVersion: {
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textSecondary,
    marginTop: 4,
  },
  appCopyright: {
    fontSize: figmaFonts.sizes.xs,
    color: figmaColors.textMuted,
    marginTop: figmaSpacing.md,
  },
  appTeam: {
    fontSize: figmaFonts.sizes.xs,
    color: figmaColors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
});
