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
  const fetchProfile = useLeagueStore((state) => state.fetchProfile);
  const setUserProfile = useLeagueStore((state) => state.setUserProfile);
  const userProfile = useLeagueStore((state) => state.userProfile);
  const syncActiveLeague = useLeagueStore((state) => state.syncActiveLeague);
  const resetStore = useLeagueStore((state) => state.logout); // Varsa reset fonksiyonun

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 1. Session ve Profil Yönetimi
    const fetchAndSetProfile = async (userId: string | undefined) => {
      if (!userId) {
        setUserProfile(null);
        setIsReady(true);
        return;
      }

      try {
        // Detaylı profil ve logo sorgusu
        const { data: profile, error } = await supabase
          .from('profiles')
          .select(`
        *,
        official_teams:favorite_team_id (
          logo_url
        )
      `)
          .eq('id', userId)
          .maybeSingle();

        if (error) throw error;

        if (profile) {
          // Logoyu objeye yerleştiriyoruz
          const formattedProfile = {
            ...profile,
            logo_url: (profile as any).official_teams?.logo_url
          };

          setUserProfile(formattedProfile);

          try {
            await syncActiveLeague(profile.id);
          } catch (syncError) {
            console.error("Lig senkronizasyon hatası:", syncError);
          }
        } else {
          setUserProfile(null);
        }
      } catch (e) {
        console.error("Profil çekme hatası:", e);
        setUserProfile(null);
      } finally {
        setIsReady(true);
      }
    };

    // İlk açılış kontrolü
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchAndSetProfile(session?.user?.id);
    });


    // Gerçek zamanlı Auth dinleyicisi
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        fetchAndSetProfile(session?.user?.id);
      } else if (event === 'SIGNED_OUT') {
        resetStore(); // Store'daki verileri temizle
        queryClient.clear(); // React Query önbelleğini süpür
        setIsReady(true);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        fetchAndSetProfile(session?.user?.id);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

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
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        <AuthGate userProfile={userProfile} />
        <GlobalAlert />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

// Redirect döngüsünü engellemek için küçük bir yardımcı component
function AuthGate({ userProfile }: { userProfile: any }) {
  if (!userProfile) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(tabs)" />;
}