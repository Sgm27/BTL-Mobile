import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { theme, spacing } from '../../constants/theme';

interface EmptyStateProps {
  message: string;
  animationSource?: string;
}

const DEFAULT_ANIMATION = require('../../assets/animations/empty-state.json');

export function EmptyState({ message, animationSource }: EmptyStateProps) {
  const source = animationSource ? { uri: animationSource } : DEFAULT_ANIMATION;

  return (
    <View style={styles.container}>
      <LottieView source={source} autoPlay loop style={styles.animation} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  animation: {
    width: 150,
    height: 150,
  },
  message: {
    marginTop: spacing.md,
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
});
