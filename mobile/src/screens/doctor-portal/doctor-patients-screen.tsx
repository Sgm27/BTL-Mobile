import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { figmaColors, figmaRadius, figmaSpacing } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  EmptyState,
  FadeInView,
  GradientHeader,
  ScreenContainer,
  SearchBar,
} from '../../components/shared';
import { api, extractPaginatedData } from '../../services/api';
import type { Appointment } from '../../types';

const HEADER_COLORS = [figmaColors.info, '#00695C'] as const;

interface PatientGroup {
  patientId: string;
  name: string;
  email?: string;
  phone?: string;
  visits: number;
  lastVisit?: string;
  appointments: Appointment[];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${d.getFullYear()}`;
}

function groupByPatient(appts: Appointment[]): PatientGroup[] {
  const map = new Map<string, PatientGroup>();
  for (const a of appts) {
    if (!a.patientId) continue;
    const existing = map.get(a.patientId);
    const visitDate = a.timeSlot?.date ?? a.createdAt;
    if (existing) {
      existing.visits += 1;
      existing.appointments.push(a);
      if (visitDate && (!existing.lastVisit || visitDate > existing.lastVisit)) {
        existing.lastVisit = visitDate;
      }
    } else {
      map.set(a.patientId, {
        patientId: a.patientId,
        name: a.patient?.name ?? 'Bệnh nhân',
        email: a.patient?.email,
        phone: a.patient?.phone,
        visits: 1,
        lastVisit: visitDate,
        appointments: [a],
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    const ad = a.lastVisit ?? '';
    const bd = b.lastVisit ?? '';
    return bd.localeCompare(ad);
  });
}

export function DoctorPatientsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await api.get('/appointments/me', {
        params: { limit: 100, sort: 'date', order: 'desc' },
      });
      const { data } = extractPaginatedData<Appointment[]>(res);
      console.log('[doctor-patients] fetched', data.length, 'appointments, non-PENDING:', data.filter(a => a.status !== 'PENDING').length);
      setAppointments(data);
    } catch (err) {
      console.error('[doctor-patients] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  }, [fetchAppointments]);

  // Only show accepted patients (not PENDING — those are unaccepted specialty-wide)
  const myAppointments = useMemo(
    () => appointments.filter((a) => a.status !== 'PENDING'),
    [appointments]
  );
  const patients = useMemo(() => groupByPatient(myAppointments), [myAppointments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => p.name.toLowerCase().includes(q));
  }, [patients, search]);

  const renderPatient = ({ item, index }: { item: PatientGroup; index: number }) => {
    const isExpanded = expandedId === item.patientId;
    return (
      <FadeInView delay={index * 60}>
        <Pressable onPress={() => setExpandedId(isExpanded ? null : item.patientId)}>
          <GlassCard style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.patientName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.metaRow}>
                  <MaterialCommunityIcons
                    name="calendar-clock"
                    size={13}
                    color={figmaColors.textSecondary}
                  />
                  <Text style={styles.metaText}>Lần khám gần nhất: {formatDate(item.lastVisit)}</Text>
                </View>
                <View style={styles.metaRow}>
                  <MaterialCommunityIcons
                    name="counter"
                    size={13}
                    color={figmaColors.textSecondary}
                  />
                  <Text style={styles.metaText}>Tổng số lần khám: {item.visits}</Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={figmaColors.textMuted}
              />
            </View>

            {isExpanded && (
              <View style={styles.expanded}>
                {item.email ? (
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons
                      name="email-outline"
                      size={14}
                      color={figmaColors.textSecondary}
                    />
                    <Text style={styles.detailText}>{item.email}</Text>
                  </View>
                ) : null}
                {item.phone ? (
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons
                      name="phone-outline"
                      size={14}
                      color={figmaColors.textSecondary}
                    />
                    <Text style={styles.detailText}>{item.phone}</Text>
                  </View>
                ) : null}
                <Text style={styles.subSectionTitle}>Lịch hẹn</Text>
                {item.appointments.slice(0, 5).map((appt) => {
                  const canExam = appt.status === 'CONFIRMED' || appt.status === 'AWAITING_PAYMENT';
                  return (
                    <Pressable
                      key={appt.id}
                      onPress={() => canExam && router.push(`/doctor-exam?id=${appt.id}`)}
                      style={({ pressed }) => [styles.apptRow, canExam && pressed && { opacity: 0.6 }]}
                    >
                      <View style={[styles.apptDot, {
                        backgroundColor: appt.status === 'CONFIRMED' ? figmaColors.primary
                          : appt.status === 'AWAITING_PAYMENT' ? '#7C4DFF'
                          : appt.status === 'COMPLETED' ? figmaColors.success
                          : figmaColors.textMuted,
                      }]} />
                      <View style={styles.apptInfo}>
                        <Text style={styles.apptText}>
                          {formatDate(appt.timeSlot?.date)} · {appt.timeSlot?.startTime?.slice(0, 5)}
                        </Text>
                        <Text style={styles.apptStatus}>
                          {appt.status === 'CONFIRMED' ? 'Đang khám'
                            : appt.status === 'AWAITING_PAYMENT' ? 'Chờ thanh toán'
                            : appt.status === 'COMPLETED' ? 'Hoàn thành'
                            : appt.status}
                          {appt.diagnosis ? ` · ${appt.diagnosis}` : ''}
                        </Text>
                      </View>
                      {canExam && (
                        <MaterialCommunityIcons name="chevron-right" size={18} color={figmaColors.textMuted} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </GlassCard>
        </Pressable>
      </FadeInView>
    );
  };

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      <GradientHeader
        title="Bệnh nhân của tôi"
        subtitle={`${patients.length} bệnh nhân`}
        colors={HEADER_COLORS}
      />

      <View style={styles.searchWrap}>
        <SearchBar
          placeholder="Tìm bệnh nhân theo tên..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <LottieView
            source={require('../../assets/animations/loading.json')}
            autoPlay
            loop
            style={{ width: 100, height: 100 }}
          />
        </View>
      ) : filtered.length === 0 ? (
        <FadeInView delay={150}>
          <EmptyState icon="account-group-outline" title="Chưa có bệnh nhân nào" />
        </FadeInView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.patientId}
          renderItem={renderPatient}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    marginHorizontal: figmaSpacing.lg,
    marginTop: -figmaSpacing.md,
    marginBottom: figmaSpacing.lg,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: figmaSpacing['3xl'],
  },
  listContent: {
    paddingHorizontal: figmaSpacing.lg,
    gap: figmaSpacing.sm + 2,
  },
  card: {
    borderRadius: figmaRadius.lg,
    paddingVertical: figmaSpacing.md + 2,
    paddingHorizontal: figmaSpacing.md + 2,
    marginBottom: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.md,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: figmaColors.infoBg,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: figmaColors.info,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: figmaColors.textPrimary,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.xs,
  },
  metaText: {
    fontSize: 12,
    color: figmaColors.textSecondary,
  },
  expanded: {
    marginTop: figmaSpacing.md,
    paddingTop: figmaSpacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: figmaColors.border,
    gap: figmaSpacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.sm,
  },
  detailText: {
    fontSize: 13,
    color: figmaColors.textSecondary,
    flex: 1,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: figmaColors.textPrimary,
    marginTop: figmaSpacing.xs,
  },
  apptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: figmaColors.border,
  },
  apptDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  apptInfo: {
    flex: 1,
    gap: 1,
  },
  apptStatus: {
    fontSize: 11,
    color: figmaColors.textMuted,
  },
  apptText: {
    fontSize: 13,
    color: figmaColors.textSecondary,
    flex: 1,
  },
});
