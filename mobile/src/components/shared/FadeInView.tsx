import React, { useEffect, useRef } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

interface FadeInViewProps {
  delay?: number;
  duration?: number;
  distance?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function FadeInView({
  delay = 0,
  duration = 400,
  distance = 16,
  children,
  style,
}: FadeInViewProps) {
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: 0,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [delay, duration, translateY]);

  return (
    <Animated.View style={[{ transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}
