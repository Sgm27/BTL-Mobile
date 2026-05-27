import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { systemColors, theme } from '../../constants/theme';

interface EmptyStateProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  message?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon = 'inbox', title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.root}>
      <MaterialCommunityIcons name={icon} size={64} color={systemColors.gray3} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {action ? (
        <Button mode="contained" onPress={action.onPress} style={styles.btn}>
          {action.label}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  title: { fontSize: 18, fontWeight: '700', color: theme.colors.onSurface, marginTop: 12 },
  message: { fontSize: 14, color: systemColors.gray, textAlign: 'center', maxWidth: 280 },
  btn: { marginTop: 16, borderRadius: 12 },
});
