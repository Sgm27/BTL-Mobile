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

function isUpcoming(appointment: Appointment): boolean {
  return appointment.status === 'PENDING' || appointment.status === 'CONFIRMED' || appointment.status === 'AWAITING_PAYMENT';
}

function isPast(appointment: Appointment): boolean {
  return appointment.status === 'COMPLETED' || appointment.status === 'CANCELED';
}

type TabKey = 'upcoming' | 'past';

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export function AppointmentsScreen() {
  const { appointments, isLoading, reload } = useMyAppointments();
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  const upcomingAppointments = appointments
    .filter(isUpcoming)
    .sort((a, b) => {
      const dateA = a.timeSlot?.date ?? '';
      const dateB = b.timeSlot?.date ?? '';
      const timeA = a.timeSlot?.startTime ?? '';
      const timeB = b.timeSlot?.startTime ?? '';
      return `${dateA}${timeA}`.localeCompare(`${dateB}${timeB}`);
    });

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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

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
              ? 'Hãy đặt lịch khám để bắt đầu chăm sóc sức khỏe của bạn.'
              : 'Các lịch hẹn đã hoàn thành hoặc đã hủy sẽ hiển thị ở đây.'
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
