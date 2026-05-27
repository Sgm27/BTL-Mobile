import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { LoadingScreen } from '../../src/components/loading-screen';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
