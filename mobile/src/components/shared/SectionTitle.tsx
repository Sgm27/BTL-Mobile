import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../../constants/theme';

interface SectionTitleProps {
  title: string;
  action?: { label: string; onPress: () => void };
}

export function SectionTitle({ title, action }: SectionTitleProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action ? (
        <Pressable
          onPress={() => {
            console.log('[SectionTitle] action press:', title, '→', action.label);
            action.onPress();
          }}
          hitSlop={12}
          style={({ pressed }) => pressed && { opacity: 0.6 }}
        >
          <Text style={styles.action}>{action.label} ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.onSurface },
  action: { fontSize: 14, color: theme.colors.primary, fontWeight: '600' },
});
