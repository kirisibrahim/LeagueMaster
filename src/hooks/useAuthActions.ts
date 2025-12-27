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
      // 1. Supabase oturumunu kapat (Sunucu tarafı)
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // 2. Zustand Store'u sıfırla (Bellek temizliği)
      logoutStore();

      // 3. TanStack Query Cache'ini uçur (Eski lig verileri/puan durumu silinir)
      queryClient.clear();

      // 4. Kullanıcıyı giriş ekranına yönlendir
      // Not: Eğer (auth) grubun varsa oraya yönlendir
      router.replace('/(auth)/login'); 

    } catch (error: any) {
      Alert.alert("Çıkış Hatası", error.message);
    }
  };

  return { handleSignOut };
};