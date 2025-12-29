import { supabase } from '@/api/supabase';
import { GlobalAlert } from '@/components/common/GlobalAlert';
import { useLeagueStore } from '@/store/useLeagueStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const queryClient = new QueryClient();

export default function RootLayout() {
  const setUserProfile = useLeagueStore((state) => state.setUserProfile);
  const userProfile = useLeagueStore((state) => state.userProfile);
  const syncActiveLeague = useLeagueStore((state) => state.syncActiveLeague);
  const showNotification = useNotificationStore((state) => state.showNotification);

  const segments = useSegments();
  const router = useRouter();
  
  // Uygulamanın yönlendirme yapmaya hazır olup olmadığını tutar
  const [isReady, setIsReady] = useState(false);
  
  const url = Linking.useURL();

  // 1. Deep Linking Kontrolü
  useEffect(() => {
    if (url) {
      const { hostname, path } = Linking.parse(url);
      if (path === 'confirm' || hostname === 'confirm') {
        showNotification("E-posta onaylandı! Arenaya giriş yapabilirsin.", "success");
        router.replace('/(auth)/login');
      }
    }
  }, [url]);

  // 2. Profil ve Oturum Yönetimi
  useEffect(() => {
    const fetchAndSetProfile = async (userId: string | undefined) => {
      // Eğer kullanıcı ID yoksa işlemi bitir ve ready yap
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
          await syncActiveLeague(profile.id);
        } else {
          setUserProfile(null);
        }
      } catch (e) {
        console.error("Profile fetch error:", e);
        setUserProfile(null);
      } finally {
        // İşlem bittikten sonra yönlendirmeye izin ver
        setIsReady(true);
      }
    };

    // İlk oturumu kontrol et
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchAndSetProfile(session?.user?.id);
    });

    // Oturum değişikliklerini dinle
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // Giriş yapıldığında veya oturum yenilendiğinde tekrar profil çek
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchAndSetProfile(session?.user?.id);
      } else if (event === 'SIGNED_OUT') {
        setUserProfile(null);
        setIsReady(true);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 3. Navigasyon Kontrolü (Gidip gelmeyi engelleyen kısım)
  useEffect(() => {
    // Profil verisi gelene veya session kesinleşene kadar bekle
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    // Durum Analizi:
    if (userProfile) {
      // Kullanıcı varsa ve hala login/register sayfalarındaysa dashboard'a at
      if (inAuthGroup) {
        router.replace('/(tabs)');
      }
    } else {
      // Kullanıcı yoksa ve auth grubu dışında bir yerdeyse login'e çek
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    }
  }, [userProfile, segments, isReady]);

  // Yükleme ekranı (isReady olana kadar kullanıcı bunu görür)
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
        <GlobalAlert />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}