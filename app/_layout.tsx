import { supabase } from '@/api/supabase';
import { useLeagueStore } from '@/store/useLeagueStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const queryClient = new QueryClient();

export default function RootLayout() {
  const setUserProfile = useLeagueStore((state) => state.setUserProfile);
  const userProfile = useLeagueStore((state) => state.userProfile);
  const syncActiveLeague = useLeagueStore((state) => state.syncActiveLeague);

  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // profil ve aktif lig senkrenizasyonu
  useEffect(() => {
    const fetchAndSetProfile = async (userId: string | undefined) => {
      if (!userId) {
        setUserProfile(null);
        setIsReady(true);
        return;
      }
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && profile) {
          setUserProfile(profile);
          // giriş yapılmışsa lig bilgisini arka planda yenile
          await syncActiveLeague(profile.id);
        } else {
          setUserProfile(null);
        }
      } catch (e) {
        console.error("Profile fetch error:", e);
        setUserProfile(null);
      } finally {
        setIsReady(true);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchAndSetProfile(session?.user?.id);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchAndSetProfile(session?.user?.id);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [setUserProfile, syncActiveLeague]);

  // navigasyon kontrolü
  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!userProfile && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (userProfile && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [userProfile, segments, isReady]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b0e11', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#00ff85" size="large" />
      </View>
    );
  }

  // tablar herzaman erişeilebilir
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}