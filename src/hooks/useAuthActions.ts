import { supabase } from '@/api/supabase';
import { useLeagueStore } from '@/store/useLeagueStore';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export const useAuthActions = () => {
  const logoutStore = useLeagueStore((state) => state.logout);
  const queryClient = useQueryClient();
  const router = useRouter();

  // kayıt olma OTP tetikleme
  const handleSignUp = async (email: string, pass: string, metadata: any) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: {
        data: metadata, // Username ve Takım bilgileri buraya gidiyor
      }
    });

    if (error) throw error;

    if (data.user && !data.session) {
      // Session yoksa doğrulama ekranına yönlendir
      router.push({
        pathname: '/(auth)/verify',
        params: { email: email.trim() }
      });
    }
    return data;
  };

  const handleVerifyOtp = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });

    if (error) throw error;

    if (data.session && data.user) {
      const { user_metadata } = data.user;

      // veritabanı güncelle
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: user_metadata.username,
          favorite_team: user_metadata.favorite_team,
          favorite_team_id: user_metadata.favorite_team_id,
          // updated_at: new Date()
        })
        .eq('id', data.user.id);

      if (updateError) {
        console.error("Profil güncellenirken hata oluştu:", updateError.message);
      }

      // zustand store güncelle
      useLeagueStore.getState().setUserProfile({
        id: data.user.id,
        username: user_metadata.username,
        favorite_team: user_metadata.favorite_team,
        favorite_team_id: user_metadata.favorite_team_id,
        logo_url: user_metadata.logo_url,
      });

      // yönlendir
      router.replace('/');
    }
    return data;
  };

  // çıkış yapma
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      logoutStore();
      queryClient.clear();
      router.replace('/(auth)/login');
    } catch (error: any) {
      Alert.alert("Çıkış Hatası", error.message);
    }
  };

  return { handleSignOut, handleSignUp, handleVerifyOtp };
};