import { supabase } from '@/api/supabase';
import { useLeagueStore } from '@/store/useLeagueStore';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export const useAuthActions = () => {
  const logoutStore = useLeagueStore((state) => state.logout);
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      // supabase oturumunu kapat
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // zustand store sıfırla bellek temizle
      logoutStore();

      // tanstack cache temizle
      queryClient.clear();

      // giriş ekranına yönlendir
      router.replace('/(auth)/login'); 

    } catch (error: any) {
      Alert.alert("Çıkış Hatası", error.message);
    }
  };

  return { handleSignOut };
};