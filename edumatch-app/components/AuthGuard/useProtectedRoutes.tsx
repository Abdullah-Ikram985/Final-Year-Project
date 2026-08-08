import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useProtectedRoute() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    }

    if (user && inAuthGroup) {
      if (user.role === 'recruiter') {
        router.replace('/(recruiter)');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [user, isLoading, segments]);
}
