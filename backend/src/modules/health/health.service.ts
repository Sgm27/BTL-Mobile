import { HealthMetricType, AlertSeverity } from '@prisma/client';
import { prisma } from '../../config/database';
import { chatCompletion } from '../../utils/ai-client';
import type { RecordMetricInput, GetMetricsQuery } from './health.schemas';

export class HealthService {
  static async recordMetric(userId: string, input: RecordMetricInput) {
    const metric = await prisma.healthMetric.create({
      data: {
        userId,
        type: input.type,
        value: input.value,
      },
    });

    // Run anomaly check in the background (don't block response)
    HealthService.checkAnomalies(userId).catch(console.error);

    return metric;
  }

  static async getMetrics(userId: string, query: GetMetricsQuery) {
    const where: Record<string, unknown> = { userId };

    if (query.type) {
      where.type = query.type;
    }

    if (query.from || query.to) {
      where.recordedAt = {};
      if (query.from) (where.recordedAt as Record<string, unknown>).gte = new Date(query.from);
      if (query.to) (where.recordedAt as Record<string, unknown>).lte = new Date(query.to);
    }

    const metrics = await prisma.healthMetric.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: 100,
    });

    return metrics;
  }

  static async getAlerts(userId: string) {
    const alerts = await prisma.healthAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return alerts;
  }

  static async checkAnomalies(userId: string) {
    const alerts: Array<{
      metricType: HealthMetricType;
      message: string;
      severity: AlertSeverity;
    }> = [];

    // Get recent readings (last 10 of each type)
    const recentSystolic = await prisma.healthMetric.findMany({
      where: { userId, type: 'BLOOD_PRESSURE_SYSTOLIC' },
      orderBy: { recordedAt: 'desc' },
      take: 10,
    });

    const recentHeartRate = await prisma.healthMetric.findMany({
      where: { userId, type: 'HEART_RATE' },
      orderBy: { recordedAt: 'desc' },
      take: 10,
    });

    const recentBloodSugar = await prisma.healthMetric.findMany({
      where: { userId, type: 'BLOOD_SUGAR' },
      orderBy: { recordedAt: 'desc' },
      take: 5,
    });

    const latestWeight = await prisma.healthMetric.findFirst({
      where: { userId, type: 'WEIGHT' },
      orderBy: { recordedAt: 'desc' },
    });

    const latestHeight = await prisma.healthMetric.findFirst({
      where: { userId, type: 'HEIGHT' },
      orderBy: { recordedAt: 'desc' },
    });

    // BP Systolic > 140 for 3+ recent readings
    const highBpCount = recentSystolic.filter((m) => Number(m.value) > 140).length;
    if (highBpCount >= 3) {
      alerts.push({
        metricType: 'BLOOD_PRESSURE_SYSTOLIC',
        message: 'High blood pressure detected in recent readings. Please consult your doctor.',
        severity: 'HIGH',
      });
    }

    // BP Systolic < 90
    if (recentSystolic.length > 0 && Number(recentSystolic[0].value) < 90) {
      alerts.push({
        metricType: 'BLOOD_PRESSURE_SYSTOLIC',
        message: 'Low blood pressure detected. Monitor symptoms and seek medical advice.',
        severity: 'MEDIUM',
      });
    }

    // Heart rate > 100 sustained (3+ readings)
    const highHrCount = recentHeartRate.filter((m) => Number(m.value) > 100).length;
    if (highHrCount >= 3) {
      alerts.push({
        metricType: 'HEART_RATE',
        message: 'Sustained elevated heart rate detected. Consider consulting your doctor.',
        severity: 'MEDIUM',
      });
    }

    // Blood sugar > 126
    if (recentBloodSugar.length > 0 && Number(recentBloodSugar[0].value) > 126) {
      alerts.push({
        metricType: 'BLOOD_SUGAR',
        message: 'High blood sugar level detected. Please consult your doctor about diabetes screening.',
        severity: 'HIGH',
      });
    }

    // BMI > 30 (calculate from weight + height)
    if (latestWeight && latestHeight) {
      const weightKg = Number(latestWeight.value);
      const heightM = Number(latestHeight.value) / 100; // assuming cm
      if (heightM > 0) {
        const bmi = weightKg / (heightM * heightM);
        if (bmi > 30) {
          alerts.push({
            metricType: 'WEIGHT',
            message: `Obesity risk: BMI is ${bmi.toFixed(1)}. A healthy BMI is between 18.5 and 24.9.`,
            severity: 'MEDIUM',
          });
        }
      }
    }

    // Create alert records (avoid duplicating recent alerts)
    const createdAlerts = [];
    for (const alert of alerts) {
      // Check if a similar alert was created in the last 24 hours
      const recentAlert = await prisma.healthAlert.findFirst({
        where: {
          userId,
          metricType: alert.metricType,
          severity: alert.severity,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      if (!recentAlert) {
        const created = await prisma.healthAlert.create({
          data: {
            userId,
            metricType: alert.metricType,
            message: alert.message,
            severity: alert.severity,
          },
        });
        createdAlerts.push(created);
      }
    }

    return createdAlerts;
  }

  static async getHealthTips(userId: string) {
    // Gather recent metrics
    const metrics = await prisma.healthMetric.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      take: 20,
    });

    const alerts = await prisma.healthAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (metrics.length === 0) {
      return [
        {
          title: 'Start Tracking',
          tip: 'Begin recording your health metrics regularly for personalized insights.',
          icon: 'heart',
        },
        {
          title: 'Stay Hydrated',
          tip: 'Drink at least 8 glasses of water daily to maintain optimal health.',
          icon: 'water',
        },
        {
          title: 'Move More',
          tip: 'Aim for 30 minutes of moderate exercise most days of the week.',
          icon: 'exercise',
        },
      ];
    }

    // Build metrics summary
    const metricSummary = metrics.reduce(
      (acc, m) => {
        if (!acc[m.type]) acc[m.type] = [];
        acc[m.type].push(Number(m.value));
        return acc;
      },
      {} as Record<string, number[]>
    );

    const summaryText = Object.entries(metricSummary)
      .map(([type, values]) => {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const latest = values[0];
        return `${type}: latest=${latest}, avg=${avg.toFixed(1)}, readings=${values.length}`;
      })
      .join('\n');

    const alertText =
      alerts.length > 0
        ? '\nRecent alerts: ' + alerts.map((a) => `${a.severity}: ${a.message}`).join('; ')
        : '';

    const prompt = `Based on this patient's health data, provide 3 brief, actionable health tips.
Data:
${summaryText}${alertText}

Respond ONLY as a JSON array: [{"title": "...", "tip": "...", "icon": "heart|food|exercise|water|sleep"}]`;

    try {
      const response = await chatCompletion([
        { role: 'system', content: 'You are a helpful health assistant. Respond only with valid JSON.' },
        { role: 'user', content: prompt },
      ]);

      // Parse JSON from response (handle possible markdown wrapping)
      const jsonStr = response.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      const tips = JSON.parse(jsonStr) as Array<{ title: string; tip: string; icon: string }>;
      return tips;
    } catch (error) {
      console.error('AI health tips error:', error);
      // Fallback tips
      return [
        {
          title: 'Keep Tracking',
          tip: 'Continue monitoring your health metrics for better insights.',
          icon: 'heart',
        },
        {
          title: 'Balanced Diet',
          tip: 'Eat a variety of fruits, vegetables, and whole grains daily.',
          icon: 'food',
        },
        {
          title: 'Regular Exercise',
          tip: 'Stay active with at least 150 minutes of exercise per week.',
          icon: 'exercise',
        },
      ];
    }
  }
}
