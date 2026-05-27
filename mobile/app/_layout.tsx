import { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GlassContainer } from 'expo-glass-effect';
import { theme, darkTheme } from '../src/constants/theme';
import { useAuthStore } from '../src/store/auth.store';
import { useThemeStore } from '../src/store/theme.store';

const USE_GLASS =
  Platform.OS === 'ios' &&
  typeof Platform.Version === 'string' &&
  parseInt(Platform.Version, 10) >= 26;

export default function RootLayout() {
  const loadUser = useAuthStore((state) => state.loadUser);
  const loadTheme = useThemeStore((state) => state.load);
  const isDark = useThemeStore((state) => state.isDark);

  useEffect(() => {
    void loadUser();
    void loadTheme();
  }, [loadUser, loadTheme]);

  const paperTheme = isDark ? darkTheme : theme;

  const content = (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <Stack screenOptions={{ headerShown: false }} />
      </PaperProvider>
    </SafeAreaProvider>
  );

  if (USE_GLASS) {
    return (
      <GlassContainer style={{ flex: 1 }}>
        {content}
      </GlassContainer>
    );
  }

  return content;
}
