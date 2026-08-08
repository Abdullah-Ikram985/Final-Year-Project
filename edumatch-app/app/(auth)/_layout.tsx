import { useProtectedRoute } from '@/components/AuthGuard/useProtectedRoutes';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  useProtectedRoute();
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name='index' />
      <Stack.Screen name='login' />
    </Stack>
  );
}
