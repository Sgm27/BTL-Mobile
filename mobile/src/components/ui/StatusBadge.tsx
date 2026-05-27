import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface StatusBadgeProps {
  status: AppointmentStatus;
}

interface StatusConfig {
  color: string;
  background: string;
  icon: IconName;
  label: string;
}

const STATUS_MAP: Record<AppointmentStatus, StatusConfig> = {
  PENDING: {
    color: '#FF9500',
    background: '#FFF3E0',
    icon: 'clock-outline',
    label: 'Pending',
  },
  CONFIRMED: {
    color: '#007AFF',
    background: '#D6EAFF',
    icon: 'check-circle-outline',
    label: 'Confirmed',
  },
  COMPLETED: {
    color: '#34C759',
    background: '#D4F5DD',
    icon: 'check-decagram',
    label: 'Completed',
  },
  CANCELED: {
    color: '#FF3B30',
    background: '#FFD6D4',
    icon: 'close-circle-outline',
    label: 'Canceled',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_MAP[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.background }]}>
      <MaterialCommunityIcons name={config.icon} size={14} color={config.color} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
