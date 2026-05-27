import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { LoadingScreen } from '../../src/components/loading-screen';

/**
 * (app) Stack — auth-gated.
 *
 * Children:
 * - (tabs)/ → NativeTabs with the 5 main tab screens
 * - All other files in (app)/ are detail/modal Stack screens that
 *   push above the tab UI when navigated via router.push/navigate.
 */
export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 280,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
    </Stack>
  );
}
