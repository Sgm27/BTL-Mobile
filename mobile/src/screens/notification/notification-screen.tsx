import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  EmptyState,
  FadeInView,
  GradientHeader,
  ScreenContainer,
  SkeletonCard,
} from '../../components/shared';
import { figmaColors, figmaFonts, figmaRadius, figmaSpacing } from '../../constants/theme';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  type Notification,
  type NotificationType,
} from '../../services/notification.service';

const NOTIFICATION_ICONS: Record<NotificationType, keyof typeof MaterialCommunityIcons.glyphMap> = {
  APPOINTMENT_REMINDER: 'calendar-clock',
  APPOINTMENT_CONFIRMED: 'calendar-check',
  APPOINTMENT_CANCELED: 'calendar-remove',
  MEDICINE_REMINDER: 'pill',
  HEALTH_ALERT: 'heart-pulse',
  SYSTEM: 'bell',
};

const NOTIFICATION_COLORS: Record<NotificationType, { color: string; bg: string }> = {
  APPOINTMENT_REMINDER: { color: figmaColors.primary, bg: figmaColors.pastelBlue },
  APPOINTMENT_CONFIRMED: { color: figmaColors.success, bg: figmaColors.successBg },
  APPOINTMENT_CANCELED: { color: figmaColors.error, bg: figmaColors.errorBg },
  MEDICINE_REMINDER: { color: figmaColors.info, bg: figmaColors.infoBg },
  HEALTH_ALERT: { color: '#C93400', bg: figmaColors.pastelOrange },
  SYSTEM: { color: '#7C4DFF', bg: figmaColors.pastelPurple },
};

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  APPOINTMENT_REMINDER: 'Nhắc lịch hẹn',
  APPOINTMENT_CONFIRMED: 'Lịch hẹn được xác nhận',
  APPOINTMENT_CANCELED: 'Lịch hẹn bị hủy',
  MEDICINE_REMINDER: 'Nhắc uống thuốc',
  HEALTH_ALERT: 'Cảnh báo sức khỏe',
  SYSTEM: 'Hệ thống',
};

function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return new Date(dateString).toLocaleDateString('vi-VN');
}

export function NotificationScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getMyNotifications({ limit: 50 });
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = useCallback(async (notification: Notification) => {
    if (notification.isRead) return;

    try {
      await markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setMarkingAll(false);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      <GradientHeader
        title="Thông báo"
        showBack
        subtitle={unreadCount > 0 ? `${unreadCount} chưa đọc` : undefined}
        colors={[figmaColors.warning, '#C93400']}
        rightSlot={
          unreadCount > 0 ? (
            <Button
              mode="contained"
              onPress={handleMarkAllAsRead}
              loading={markingAll}
              disabled={markingAll}
              compact
              style={styles.markAllBtn}
              buttonColor="rgba(255,255,255,0.25)"
              textColor="#fff"
              labelStyle={styles.markAllLabel}
            >
              Đánh dấu tất cả là đã đọc
            </Button>
          ) : undefined
        }
      />

      {loading && notifications.length === 0 ? (
        <View style={styles.listContainer}>
          <SkeletonCard rows={4} />
        </View>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="bell-off-outline"
          title="Chưa có thông báo nào"
          message="Bạn sẽ nhận được thông báo khi có cập nhật mới"
        />
      ) : (
        <View style={styles.listContainer}>
          {notifications.map((notification, index) => {
            const cfg = NOTIFICATION_COLORS[notification.type];
            return (
              <FadeInView key={notification.id} delay={index * 60}>
                <GlassCard style={styles.notificationCard}>
                  <View
                    style={styles.notificationRow}
                    onTouchEnd={() => handleMarkAsRead(notification)}
                  >
                    {!notification.isRead && <View style={styles.unreadDot} />}

                    <View style={[styles.iconContainer, { backgroundColor: cfg.bg }]}>
                      <MaterialCommunityIcons
                        name={NOTIFICATION_ICONS[notification.type]}
                        size={22}
                        color={cfg.color}
                      />
                    </View>

                    <View style={styles.notificationContent}>
                      <Text
                        style={[
                          styles.typeLabel,
                          { color: cfg.color },
                        ]}
                      >
                        {NOTIFICATION_TYPE_LABELS[notification.type]}
                      </Text>
                      <Text
                        style={[
                          styles.notificationTitle,
                          !notification.isRead && styles.notificationTitleUnread,
                        ]}
                        numberOfLines={1}
                      >
                        {notification.title}
                      </Text>
                      <Text style={styles.notificationBody} numberOfLines={2}>
                        {notification.body}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatRelativeTime(notification.createdAt)}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </FadeInView>
            );
          })}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: figmaColors.background,
  },
  markAllBtn: {
    borderRadius: figmaRadius.pill,
  },
  markAllLabel: {
    fontSize: figmaFonts.sizes.xs,
    fontWeight: figmaFonts.weights.semibold,
  },
  listContainer: {
    marginTop: figmaSpacing.md,
    paddingHorizontal: figmaSpacing.lg,
    gap: figmaSpacing.sm,
  },
  notificationCard: {
    padding: figmaSpacing.md,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: figmaSpacing.md,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: figmaColors.primary,
    marginTop: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: figmaRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    gap: 2,
  },
  typeLabel: {
    fontSize: figmaFonts.sizes.xs,
    fontWeight: figmaFonts.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  notificationTitle: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.medium,
    color: figmaColors.textPrimary,
  },
  notificationTitleUnread: {
    fontWeight: figmaFonts.weights.bold,
  },
  notificationBody: {
    fontSize: figmaFonts.sizes.base,
    color: figmaColors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  notificationTime: {
    fontSize: figmaFonts.sizes.xs,
    color: figmaColors.textMuted,
    marginTop: 4,
  },
});
