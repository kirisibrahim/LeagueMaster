import { supabase } from '@/api/supabase';
import { GlobalAlert } from '@/components/common/GlobalAlert';
import { useLeagueStore } from '@/store/useLeagueStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const queryClient = new QueryClient();

export default function RootLayout() {
  const setUserProfile = useLeagueStore((state) => state.setUserProfile);
  const userProfile = useLeagueStore((state) => state.userProfile);
  const syncActiveLeague = useLeagueStore((state) => state.syncActiveLeague);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await fetchAndSetProfile(session?.user?.id);
    };

    const fetchAndSetProfile = async (userId: string | undefined) => {
      if (!userId) {
        setUserProfile(null);
        setIsReady(true);
        return;
      }
      try {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (profile) {
          setUserProfile(profile);
          await syncActiveLeague(profile.id);
        } else {
          setUserProfile(null);
        }
      } catch (e) {
        setUserProfile(null);
      } finally {
        setIsReady(true);
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        fetchAndSetProfile(session?.user?.id);
      } else if (event === 'SIGNED_OUT') {
        setUserProfile(null);
        setIsReady(true);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // veri gelene kadar navigatörü render etme
  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b0e11', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#00ff85" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* iki grup da stack içinde tanımlı kalır ana girişte kullanıcı durumuna göre yönlendirme yapılır */}
          <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        {userProfile ? (
          <Redirect href="/(tabs)" />
        ) : (
          <Redirect href="/(auth)/login" />
        )}
        <GlobalAlert />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}