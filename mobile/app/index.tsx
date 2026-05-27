import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/auth.store';
import { LoadingScreen } from '../src/components/loading-screen';

export default function Index() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <Redirect href={isAuthenticated ? '/home' : '/login'} />;
}
