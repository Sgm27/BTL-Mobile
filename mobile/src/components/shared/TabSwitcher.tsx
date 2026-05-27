import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { GlassCard } from '../ui/GlassCard';
import { theme, systemColors } from '../../constants/theme';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  badge?: number | string;
}

interface TabSwitcherProps<T extends string> {
  tabs: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function TabSwitcher<T extends string>({
  tabs,
  value,
  onChange,
}: TabSwitcherProps<T>) {
  const [containerWidth, setContainerWidth] = useState(0);
  const indicatorX = useRef(new Animated.Value(0)).current;

  // Animations for each tab (label color, badge bounce, scale)
  const tabAnims = useRef(tabs.map(() => new Animated.Value(0))).current;

  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.value === value),
  );

  // Slide indicator
  useEffect(() => {
    if (containerWidth === 0) return;
    const tabWidth = (containerWidth - 8) / tabs.length; // minus padding
    Animated.spring(indicatorX, {
      toValue: activeIndex * tabWidth,
      useNativeDriver: true,
      tension: 120,
      friction: 14,
    }).start();
  }, [activeIndex, containerWidth, tabs.length, indicatorX]);

  // Animate per-tab values (for color/scale)
  useEffect(() => {
    tabAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: i === activeIndex ? 1 : 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // color interpolation needs JS
      }).start();
    });
  }, [activeIndex, tabAnims]);

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const tabWidth = containerWidth > 0 ? (containerWidth - 8) / tabs.length : 0;

  return (
    <GlassCard style={styles.outer}>
      <View style={styles.row} onLayout={onLayout}>
        {/* Animated sliding indicator */}
        {containerWidth > 0 && (
          <Animated.View
            style={[
              styles.indicator,
              {
                width: tabWidth,
                transform: [{ translateX: indicatorX }],
              },
            ]}
          />
        )}

        {tabs.map((tab, i) => (
          <TabButton
            key={tab.value}
            tab={tab}
            anim={tabAnims[i]!}
            active={i === activeIndex}
            onPress={() => onChange(tab.value)}
          />
        ))}
      </View>
    </GlassCard>
  );
}

interface TabButtonProps<T extends string> {
  tab: TabItem<T>;
  anim: Animated.Value;
  active: boolean;
  onPress: () => void;
}

function TabButton<T extends string>({ tab, anim, active, onPress }: TabButtonProps<T>) {
  const scale = useRef(new Animated.Value(1)).current;
  const badgeBounce = useRef(new Animated.Value(1)).current;

  // Bounce badge when becoming active
  useEffect(() => {
    if (active && tab.badge !== undefined && tab.badge !== 0) {
      Animated.sequence([
        Animated.timing(badgeBounce, {
          toValue: 1.3,
          duration: 150,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(badgeBounce, {
          toValue: 1,
          friction: 4,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [active, badgeBounce, tab.badge]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      friction: 8,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  const labelColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [systemColors.gray, '#ffffff'],
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tab}
    >
      <Animated.View
        style={[
          styles.tabContent,
          { transform: [{ scale }] },
        ]}
      >
        <Animated.Text style={[styles.label, { color: labelColor }]}>
          {tab.label}
        </Animated.Text>
        {tab.badge !== undefined && tab.badge !== 0 && (
          <Animated.View
            style={[
              styles.badge,
              active && styles.badgeActive,
              { transform: [{ scale: badgeBounce }] },
            ]}
          >
            <Text style={[styles.badgeText, active && styles.badgeTextActive]}>
              {tab.badge}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: 16,
    padding: 4,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    zIndex: 1,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: systemColors.gray3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  badgeTextActive: {
    color: '#fff',
  },
});
