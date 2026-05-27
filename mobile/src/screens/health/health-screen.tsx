import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Badge,
  Button,
  Chip,
  FAB,
  Text,
  TextInput,
} from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  EmptyState,
  FadeInView,
  GradientHeader,
  MetricCard,
  ScreenContainer,
  SectionTitle,
} from '../../components/shared';
import { figmaColors, figmaFonts, figmaRadius, figmaSpacing } from '../../constants/theme';
import {
  getMyMetrics,
  getMyAlerts,
  getHealthTips,
  recordMetric,
  type HealthMetric,
  type HealthMetricType,
  type HealthAlert,
  type HealthTip,
} from '../../services/health.service';

const SCREEN_WIDTH = Dimensions.get('window').width;

type RangeKey = 'all' | '7d' | '30d' | '3m';

const RANGE_CHIPS: Array<{ key: RangeKey; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: '7d', label: '7 ngày' },
  { key: '30d', label: '30 ngày' },
  { key: '3m', label: '3 tháng' },
];

const METRIC_LABELS_VI: Record<HealthMetricType, string> = {
  BLOOD_PRESSURE_SYSTOLIC: 'Huyết áp tâm thu',
  BLOOD_PRESSURE_DIASTOLIC: 'Huyết áp tâm trương',
  WEIGHT: 'Cân nặng',
  HEIGHT: 'Chiều cao',
  BLOOD_SUGAR: 'Đường huyết',
  HEART_RATE: 'Nhịp tim',
};

const METRIC_UNITS: Record<HealthMetricType, string> = {
  BLOOD_PRESSURE_SYSTOLIC: 'mmHg',
  BLOOD_PRESSURE_DIASTOLIC: 'mmHg',
  WEIGHT: 'kg',
  HEIGHT: 'cm',
  BLOOD_SUGAR: 'mg/dL',
  HEART_RATE: 'bpm',
};

const METRIC_ICONS: Record<HealthMetricType, string> = {
  BLOOD_PRESSURE_SYSTOLIC: '❤️',
  BLOOD_PRESSURE_DIASTOLIC: '💗',
  WEIGHT: '⚖️',
  HEIGHT: '📏',
  BLOOD_SUGAR: '🩸',
  HEART_RATE: '💓',
};

const METRIC_ICON_BG: Record<HealthMetricType, string> = {
  BLOOD_PRESSURE_SYSTOLIC: figmaColors.pastelRed,
  BLOOD_PRESSURE_DIASTOLIC: figmaColors.pastelRed,
  WEIGHT: figmaColors.pastelBlue,
  HEIGHT: figmaColors.pastelTeal,
  BLOOD_SUGAR: figmaColors.pastelOrange,
  HEART_RATE: figmaColors.pastelPurple,
};

const CHART_METRICS: HealthMetricType[] = [
  'BLOOD_PRESSURE_SYSTOLIC',
  'BLOOD_PRESSURE_DIASTOLIC',
  'WEIGHT',
  'HEART_RATE',
  'BLOOD_SUGAR',
  'HEIGHT',
];

const SEVERITY_COLORS: Record<string, string> = {
  LOW: figmaColors.success,
  MEDIUM: figmaColors.warning,
  HIGH: figmaColors.error,
  CRITICAL: figmaColors.error,
};

const SEVERITY_LABELS: Record<string, string> = {
  LOW: 'Bình thường',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  CRITICAL: 'Nguy hiểm',
};

const TIP_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  heart: 'heart-pulse',
  food: 'food-apple',
  exercise: 'run',
  water: 'water',
  sleep: 'sleep',
};

const HEADER_GRADIENT = [figmaColors.error, '#B71C1C'] as const;

export function HealthScreen() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [tips, setTips] = useState<HealthTip[]>([]);
  const [selectedType, setSelectedType] = useState<HealthMetricType>('BLOOD_PRESSURE_SYSTOLIC');
  const [range, setRange] = useState<RangeKey>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputType, setInputType] = useState<HealthMetricType>('BLOOD_PRESSURE_SYSTOLIC');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [metricsData, alertsData, tipsData] = await Promise.all([
        getMyMetrics({ type: selectedType }),
        getMyAlerts(),
        getHealthTips(),
      ]);
      setMetrics(metricsData);
      setAlerts(alertsData);
      setTips(tipsData);
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedType]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleAddReading = async () => {
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || numValue <= 0) return;

    setSubmitting(true);
    try {
      await recordMetric({ type: inputType, value: numValue });
      setModalVisible(false);
      setInputValue('');
      fetchData();
    } catch (error) {
      console.error('Failed to record metric:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter by range
  const filteredMetrics = useMemo(() => {
    if (range === 'all') return metrics;
    const now = Date.now();
    const cutoff =
      range === '7d'
        ? now - 7 * 86400000
        : range === '30d'
        ? now - 30 * 86400000
        : now - 90 * 86400000;
    return metrics.filter((m) => new Date(m.recordedAt).getTime() >= cutoff);
  }, [metrics, range]);

  // Prepare chart data
  const chartMetrics = [...filteredMetrics].reverse().slice(-10);
  const chartData = {
    labels: chartMetrics.map((m) => {
      const d = new Date(m.recordedAt);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: chartMetrics.length > 0 ? chartMetrics.map((m) => Number(m.value)) : [0],
        color: () => figmaColors.primary,
        strokeWidth: 2,
      },
    ],
  };

  const latest = filteredMetrics[0] ?? null;

  if (loading && metrics.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={figmaColors.error} />
      </View>
    );
  }

  return (
    <>
      <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
        <GradientHeader
          title="Theo dõi sức khỏe"
          showBack
          subtitle="Chăm sóc sức khỏe của bạn"
          colors={HEADER_GRADIENT}
        />

        {/* Metric summary cards */}
        <FadeInView delay={100}>
          <View style={styles.sectionTop}>
            <SectionTitle title="Chỉ số sức khỏe" />
          </View>
          <View style={styles.metricsGrid}>
            <MetricCard
              icon={METRIC_ICONS[selectedType]}
              value={latest ? Number(latest.value).toFixed(selectedType === 'WEIGHT' ? 1 : 0) : '--'}
              unit={METRIC_UNITS[selectedType]}
              label={METRIC_LABELS_VI[selectedType]}
              iconBgColor={METRIC_ICON_BG[selectedType]}
              style={styles.metricCard}
            />
            <MetricCard
              icon="📊"
              value={filteredMetrics.length}
              label="Số lần đo"
              iconBgColor={figmaColors.pastelGreen}
              style={styles.metricCard}
            />
          </View>
        </FadeInView>

        {/* Metric type selector */}
        <FadeInView delay={150}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {CHART_METRICS.map((type) => (
              <Chip
                key={type}
                selected={selectedType === type}
                onPress={() => setSelectedType(type)}
                style={[styles.chip, selectedType === type && styles.chipSelected]}
                textStyle={selectedType === type ? styles.chipTextSelected : styles.chipText}
              >
                {METRIC_LABELS_VI[type]}
              </Chip>
            ))}
          </ScrollView>
        </FadeInView>

        {/* Range filter chips */}
        <FadeInView delay={200}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {RANGE_CHIPS.map((chip) => (
              <Chip
                key={chip.key}
                selected={range === chip.key}
                onPress={() => setRange(chip.key)}
                style={[styles.chip, range === chip.key && styles.chipSelected]}
                textStyle={range === chip.key ? styles.chipTextSelected : styles.chipText}
              >
                {chip.label}
              </Chip>
            ))}
          </ScrollView>
        </FadeInView>

        {/* Chart */}
        <FadeInView delay={300}>
          <View style={styles.sectionTop}>
            <SectionTitle title="Biểu đồ theo dõi" />
          </View>
          <GlassCard style={styles.chartCard}>
            {chartMetrics.length > 1 ? (
              <LineChart
                data={chartData}
                width={SCREEN_WIDTH - 64}
                height={200}
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: figmaColors.surface,
                  backgroundGradientTo: figmaColors.surface,
                  decimalPlaces: 0,
                  color: () => figmaColors.primary,
                  labelColor: () => figmaColors.textSecondary,
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: figmaColors.primary,
                  },
                  propsForBackgroundLines: {
                    stroke: figmaColors.border,
                  },
                }}
                bezier
                style={styles.chart}
              />
            ) : (
              <EmptyState
                icon="chart-line"
                title="Chưa có dữ liệu sức khỏe"
                message="Hãy thêm chỉ số đầu tiên"
              />
            )}
          </GlassCard>
        </FadeInView>

        {/* Alerts */}
        {alerts.length > 0 && (
          <FadeInView delay={400}>
            <View style={styles.sectionTop}>
              <SectionTitle title="Cảnh báo" />
            </View>
            {alerts.slice(0, 5).map((alert) => (
              <GlassCard key={alert.id} style={styles.alertCard}>
                <View style={styles.alertRow}>
                  <View style={styles.alertLeft}>
                    <MaterialCommunityIcons
                      name="alert-circle"
                      size={24}
                      color={SEVERITY_COLORS[alert.severity]}
                    />
                    <View style={styles.alertTextContainer}>
                      <Text variant="bodyMedium" style={styles.alertMessage}>
                        {alert.message}
                      </Text>
                      <Text variant="labelSmall" style={styles.alertDate}>
                        {new Date(alert.createdAt).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                  </View>
                  <Badge
                    style={[
                      styles.severityBadge,
                      { backgroundColor: SEVERITY_COLORS[alert.severity] },
                    ]}
                  >
                    {SEVERITY_LABELS[alert.severity] ?? alert.severity}
                  </Badge>
                </View>
              </GlassCard>
            ))}
          </FadeInView>
        )}

        {/* AI Tips */}
        {tips.length > 0 && (
          <FadeInView delay={500}>
            <View style={styles.sectionTop}>
              <SectionTitle title="Gợi ý từ AI" />
            </View>
            <View style={styles.tipsHeaderWrap}>
              <Text style={styles.tipsHeader}>Gợi ý chăm sóc sức khỏe</Text>
            </View>
            {tips.map((tip, index) => (
              <GlassCard key={index} style={styles.tipCard}>
                <View style={styles.tipRow}>
                  <View style={styles.tipIconContainer}>
                    <MaterialCommunityIcons
                      name={TIP_ICONS[tip.icon] ?? 'lightbulb-outline'}
                      size={28}
                      color={figmaColors.primary}
                    />
                  </View>
                  <View style={styles.tipTextContainer}>
                    <Text variant="titleSmall" style={styles.tipTitle}>
                      {tip.title}
                    </Text>
                    <Text variant="bodySmall" style={styles.tipText}>
                      {tip.tip}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            ))}
          </FadeInView>
        )}

        {/* Empty overall */}
        {!loading && metrics.length === 0 && (
          <FadeInView delay={200}>
            <EmptyState
              icon="heart-pulse"
              title="Chưa có dữ liệu sức khỏe"
              message="Hãy thêm chỉ số đầu tiên"
              action={{
                label: 'Thêm chỉ số mới',
                onPress: () => {
                  setInputType(selectedType);
                  setModalVisible(true);
                },
              }}
            />
          </FadeInView>
        )}
      </ScreenContainer>

      {/* FAB */}
      <FAB
        icon="plus"
        label="Thêm chỉ số mới"
        style={styles.fab}
        color="#fff"
        onPress={() => {
          setInputType(selectedType);
          setModalVisible(true);
        }}
      />

      {/* Add Reading Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text variant="titleLarge" style={styles.modalTitle}>
              Thêm chỉ số sức khỏe
            </Text>

            <Text style={styles.modalLabel}>Loại chỉ số</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modalChips}
            >
              {CHART_METRICS.map((type) => (
                <Chip
                  key={type}
                  selected={inputType === type}
                  onPress={() => setInputType(type)}
                  style={[styles.chip, inputType === type && styles.chipSelected]}
                  textStyle={inputType === type ? styles.chipTextSelected : styles.chipText}
                >
                  {METRIC_LABELS_VI[type]}
                </Chip>
              ))}
            </ScrollView>

            <Text style={styles.modalLabel}>Giá trị</Text>
            <TextInput
              label={`Giá trị (${METRIC_UNITS[inputType]})`}
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.modalInput}
              outlineColor={figmaColors.border}
              activeOutlineColor={figmaColors.error}
            />

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setModalVisible(false)}
                style={styles.modalBtn}
                textColor={figmaColors.textSecondary}
              >
                Hủy
              </Button>
              <Button
                mode="contained"
                onPress={handleAddReading}
                loading={submitting}
                disabled={submitting || !inputValue}
                style={styles.modalBtn}
                buttonColor={figmaColors.error}
              >
                Lưu
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: figmaColors.background,
  },
  sectionTop: {
    marginTop: figmaSpacing.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    paddingHorizontal: figmaSpacing.lg,
    gap: figmaSpacing.md,
  },
  metricCard: {
    flex: 1,
  },
  chipsContainer: {
    paddingHorizontal: figmaSpacing.lg,
    paddingVertical: figmaSpacing.sm,
    gap: figmaSpacing.sm,
  },
  chip: {
    backgroundColor: figmaColors.surfaceMuted,
    marginRight: 6,
  },
  chipSelected: {
    backgroundColor: figmaColors.error,
  },
  chipText: {
    color: figmaColors.textSecondary,
  },
  chipTextSelected: {
    color: '#fff',
  },
  chartCard: {
    marginHorizontal: figmaSpacing.lg,
    padding: figmaSpacing.lg,
  },
  chart: {
    borderRadius: figmaRadius.md,
    marginLeft: -16,
  },
  alertCard: {
    marginHorizontal: figmaSpacing.lg,
    marginBottom: figmaSpacing.sm,
    padding: figmaSpacing.lg,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertMessage: {
    color: figmaColors.textPrimary,
  },
  alertDate: {
    color: figmaColors.textMuted,
    marginTop: 2,
  },
  severityBadge: {
    color: '#fff',
    fontWeight: figmaFonts.weights.semibold,
    paddingHorizontal: figmaSpacing.sm,
  },
  tipsHeaderWrap: {
    paddingHorizontal: figmaSpacing.lg,
    marginBottom: figmaSpacing.sm,
  },
  tipsHeader: {
    fontSize: figmaFonts.sizes.md,
    fontWeight: figmaFonts.weights.semibold,
    color: figmaColors.textSecondary,
  },
  tipCard: {
    marginHorizontal: figmaSpacing.lg,
    marginBottom: figmaSpacing.sm,
    padding: figmaSpacing.lg,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: figmaSpacing.md,
  },
  tipIconContainer: {
    width: 44,
    height: 44,
    borderRadius: figmaRadius.md,
    backgroundColor: figmaColors.pastelBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipTextContainer: {
    flex: 1,
  },
  tipTitle: {
    fontWeight: figmaFonts.weights.semibold,
    color: figmaColors.textPrimary,
    marginBottom: 2,
  },
  tipText: {
    color: figmaColors.textSecondary,
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: figmaColors.error,
    borderRadius: figmaRadius.pill,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: figmaColors.surface,
    borderTopLeftRadius: figmaRadius.xl,
    borderTopRightRadius: figmaRadius.xl,
    padding: figmaSpacing.lg,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: figmaColors.border,
    alignSelf: 'center',
    marginBottom: figmaSpacing.md,
  },
  modalTitle: {
    fontWeight: figmaFonts.weights.bold,
    marginBottom: figmaSpacing.md,
    color: figmaColors.textPrimary,
  },
  modalLabel: {
    fontSize: figmaFonts.sizes.sm,
    fontWeight: figmaFonts.weights.medium,
    color: figmaColors.textSecondary,
    marginBottom: figmaSpacing.xs,
    marginTop: figmaSpacing.sm,
  },
  modalChips: {
    gap: 6,
    marginBottom: figmaSpacing.md,
  },
  modalInput: {
    marginBottom: figmaSpacing.md,
    backgroundColor: figmaColors.surface,
  },
  modalActions: {
    flexDirection: 'row',
    gap: figmaSpacing.md,
    marginTop: figmaSpacing.sm,
  },
  modalBtn: {
    flex: 1,
    borderRadius: figmaRadius.md,
  },
});
