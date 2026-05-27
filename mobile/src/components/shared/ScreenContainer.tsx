import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  type ScrollViewProps,
} from 'react-native';
import { ScreenBackground } from '../ui/ScreenBackground';

interface ScreenContainerProps extends Omit<ScrollViewProps, 'contentContainerStyle'> {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ScrollViewProps['contentContainerStyle'];
}

export function ScreenContainer({
  children,
  refreshing,
  onRefresh,
  contentStyle,
  ...rest
}: ScreenContainerProps) {
  return (
    <ScreenBackground>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, contentStyle]}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
        {...rest}
      >
        {children}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: 120, backgroundColor: 'transparent' },
});
