import { supabase } from '@/api/supabase';
import { GlobalAlert } from '@/components/common/GlobalAlert';
import { useLeagueStore } from '@/store/useLeagueStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

export default function RootLayout() {
  const setUserProfile = useLeagueStore((state) => state.setUserProfile);
  const userProfile = useLeagueStore((state) => state.userProfile);
  const syncActiveLeague = useLeagueStore((state) => state.syncActiveLeague);
  // KRİTİK: currentLeagueId'yi reaktif bir şekilde buraya çekiyoruz
  const currentLeagueId = useLeagueStore((state) => state.currentLeagueId);

  const showNotification = useNotificationStore((state) => state.showNotification);
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const url = Linking.useURL();

  // 1. Deep Linking (Değişmedi)
  useEffect(() => {
    if (url) {
      const { hostname, path } = Linking.parse(url);
      if (path === 'confirm' || hostname === 'confirm') {
        showNotification("E-posta onaylandı! Arenaya giriş yapabilirsin.", "success");
        router.replace('/(auth)/login');
      }
    }
  }, [url]);

  // 2. Profil ve Oturum Yönetimi (Hata yönetimi güçlendirildi)
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
          // Lig verisini bekliyoruz
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

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchAndSetProfile(session?.user?.id);
      } else if (event === 'SIGNED_OUT') {
        setUserProfile(null);
        setIsReady(true);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // 3. Navigasyon ve Sıçrama Engelleme Mantığı (SENIOR REVIZE)
  useEffect(() => {
    // BARAJ 1: Sistem hazır değilse veya lig verisi henüz yoldaysa (undefined) ASLA hareket etme.
    if (!isReady || currentLeagueId === undefined) return;

    const inAuthGroup = segments[0] === '(auth)';

    // BARAJ 2: Kullanıcı oturumu kontrolü
    if (userProfile) {
      // Kullanıcı var ama hala login/register sayfalarındaysa içeri (tabs) fırlat
      if (inAuthGroup) {
        router.replace('/(tabs)');
      }
    } else {
      // Kullanıcı yoksa ve içerideki sayfalardaysa login'e çek
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    }
  }, [userProfile, segments, isReady, currentLeagueId]);

  // 4. SplashScreen Kontrolü
  useEffect(() => {
    if (isReady && (userProfile ? currentLeagueId !== undefined : true)) {
      SplashScreen.hideAsync();
    }
  }, [isReady, userProfile, currentLeagueId]);

  // Yükleme ekranı (isReady veya veriler eksikse kullanıcı bunu görür)
  if (!isReady || (userProfile && currentLeagueId === undefined)) {
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
        <GlobalAlert />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}