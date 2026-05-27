import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface SpecialtyIconProps {
  name: string;
  size?: number;
  color?: string;
}

const SPECIALTY_ICON_MAP: Record<string, IconName> = {
  'Tim mạch': 'heart-pulse',
  'Thần kinh': 'brain',
  'Tiêu hóa': 'stomach',
  'Da liễu': 'face-woman',
  'Nhi khoa': 'baby-face',
  'Mắt': 'eye',
  'Đa khoa': 'hospital-box-outline',
};

const FALLBACK_ICON: IconName = 'medical-bag';

export function SpecialtyIcon({
  name,
  size = 24,
  color = theme.colors.primary,
}: SpecialtyIconProps) {
  const iconName = SPECIALTY_ICON_MAP[name] ?? FALLBACK_ICON;

  return (
    <View style={[styles.container, { width: size + 16, height: size + 16, borderRadius: (size + 16) / 2 }]}>
      <MaterialCommunityIcons name={iconName} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
  },
});
