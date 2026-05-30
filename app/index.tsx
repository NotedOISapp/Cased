import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/lib/app-context';

export default function EntryPoint() {
  const router = useRouter();
  const { state } = useApp();

  useEffect(() => {
    if (!state.isLoaded) return;
    if (state.onboardingComplete) {
      router.replace('/(tabs)');
    } else {
      router.replace('/onboarding');
    }
  }, [state.isLoaded, state.onboardingComplete, router]);

  return (
    <View style={{ flex: 1, backgroundColor: '#1C1917', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#8B1A3A" size="large" />
    </View>
  );
}
