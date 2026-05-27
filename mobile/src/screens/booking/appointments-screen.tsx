/**
 * AppointmentsScreen — Màn hình "Lịch hẹn của tôi"
 * Thuộc phần của Ngô Đức Sơn — module Booking & Appointment.
 *
 * Hiển thị toàn bộ lịch hẹn của bệnh nhân đang đăng nhập, chia thành 2 tab:
 *   - "Sắp tới": status PENDING | CONFIRMED | AWAITING_PAYMENT, sắp xếp tăng dần theo ngày/giờ
 *   - "Đã qua":  status COMPLETED | CANCELED, sắp xếp giảm dần (mới nhất lên đầu)
 *
 * Luồng chính:
 *   1. useMyAppointments hook tự động fetch GET /api/v1/appointments/me khi mount
 *   2. Người dùng chuyển tab → lọc + sắp xếp lại trên client (không gọi lại API)
 *   3. Pull-to-refresh → gọi reload() → fetch lại từ server
 *   4. Nhấn vào một card → navigate đến AppointmentDetailScreen
 */
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useMyAppointments } from '../../hooks/use-my-appointments';
import {
  AppointmentCard,
  EmptyState,
  FadeInView,
  GradientHeader,
  ScreenContainer,
  SkeletonCard,
  TabSwitcher,
} from '../../components/shared';
import { figmaColors } from '../../constants/theme';
import { formatDate } from '../../utils/format';
import type { Appointment } from '../../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Lịch "sắp tới": chưa hoàn tất và chưa bị huỷ
function isUpcoming(appointment: Appointment): boolean {
  return appointment.status === 'PENDING' || appointment.status === 'CONFIRMED' || appointment.status === 'AWAITING_PAYMENT';
}

// Lịch "đã qua": đã hoàn thành hoặc đã huỷ
function isPast(appointment: Appointment): boolean {
  return appointment.status === 'COMPLETED' || appointment.status === 'CANCELED';
}

type TabKey = 'upcoming' | 'past';

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export function AppointmentsScreen() {
  // Lấy dữ liệu và hàm reload từ hook (đã tự fetch khi mount)
  const { appointments, isLoading, reload } = useMyAppointments();
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  // Lọc và sắp xếp tăng dần (ngày gần nhất lên đầu) cho tab "Sắp tới"
  const upcomingAppointments = appointments
    .filter(isUpcoming)
    .sort((a, b) => {
      const dateA = a.timeSlot?.date ?? '';
      const dateB = b.timeSlot?.date ?? '';
      const timeA = a.timeSlot?.startTime ?? '';
      const timeB = b.timeSlot?.startTime ?? '';
      return `${dateA}${timeA}`.localeCompare(`${dateB}${timeB}`);
    });

  // Lọc và sắp xếp giảm dần (mới nhất lên đầu) cho tab "Đã qua"
  const pastAppointments = appointments
    .filter(isPast)
    .sort((a, b) => {
      const dateA = a.timeSlot?.date ?? '';
      const dateB = b.timeSlot?.date ?? '';
      const timeA = a.timeSlot?.startTime ?? '';
      const timeB = b.timeSlot?.startTime ?? '';
      return `${dateB}${timeB}`.localeCompare(`${dateA}${timeA}`);
    });

  const displayedAppointments =
    activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  // Pull-to-refresh: gọi lại API và tắt cờ refreshing khi xong
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  // Điều hướng đến màn hình chi tiết lịch hẹn
  const goToDetail = useCallback((id: string) => {
    router.push({ pathname: '/appointment-detail', params: { id } });
  }, []);

  return (
    <ScreenContainer
      refreshing={refreshing}
      onRefresh={handleRefresh}
      showsVerticalScrollIndicator={false}
    >
      <GradientHeader
        title="Lịch hẹn của tôi"
        subtitle={`${appointments.length} lịch hẹn · ${upcomingAppointments.length} sắp tới`}
        colors={[figmaColors.primary, figmaColors.primaryDark]}
      />

      <TabSwitcher<TabKey>
        tabs={[
          { value: 'upcoming', label: 'Sắp tới', badge: upcomingAppointments.length || undefined },
          { value: 'past', label: 'Đã qua', badge: pastAppointments.length || undefined },
        ]}
        value={activeTab}
        onChange={setActiveTab}
      />

      {/* Khi đang tải lần đầu: hiện skeleton placeholder thay cho danh sách thật */}
      {isLoading ? (
        <View style={styles.cardList}>
          <SkeletonCard rows={4} />
        </View>
      ) : displayedAppointments.length === 0 ? (
        <EmptyState
          icon={activeTab === 'upcoming' ? 'calendar-blank-outline' : 'history'}
          title={
            activeTab === 'upcoming'
              ? 'Bạn chưa có lịch hẹn nào sắp tới'
              : 'Bạn chưa có lịch hẹn nào trong quá khứ'
          }
          message={
            activeTab === 'upcoming'
              ? 'Hãy đặt lịch khám để bắt đầu chăm sóc sức khoẻ của bạn.'
              : 'Các lịch hẹn đã hoàn thành hoặc đã huỷ sẽ hiển thị ở đây.'
          }
          action={
            activeTab === 'upcoming'
              ? { label: 'Đặt lịch ngay', onPress: () => router.push('/booking') }
              : undefined
          }
        />
      ) : (
        <View style={styles.cardList}>
          {displayedAppointments.map((appt, i) => (
            <FadeInView key={appt.id} delay={i * 60}>
              {/* Status PENDING chưa có bác sĩ được phân công: hiện "Chờ bác sĩ nhận" thay cho tên */}
              <AppointmentCard
                doctorName={appt.status === 'PENDING' ? 'Chờ bác sĩ nhận' : (appt.doctor?.name ?? 'Bác sĩ')}
                specialty={appt.doctor?.specialty?.name ?? 'Chuyên khoa'}
                date={formatDate(appt.timeSlot?.date)}
                startTime={appt.timeSlot?.startTime ?? ''}
                endTime={appt.timeSlot?.endTime}
                status={appt.status}
                onPress={() => goToDetail(appt.id)}
              />
            </FadeInView>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 32,
  },
  loadingLottie: {
    width: 100,
    height: 100,
  },
  cardList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
});
