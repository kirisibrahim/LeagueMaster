import { supabase } from '@/api/supabase';
import { useLeagueStore } from '@/store/useLeagueStore';
import { LeagueStatus } from '@/types/database';
import { handleAppError } from '@/utils/errorHandler';
import { useState } from 'react';
import { Alert } from 'react-native';

export const useLeagueActions = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userProfile, setCurrentLeagueId } = useLeagueStore();

  // --- LİG OLUŞTURMA ---
  const createLeague = async (form: {
    name: string;
    winPoints: string;
    drawPoints: string;
    lossPoints: string;
    isDoubleRound: boolean;
  }) => {
    if (!form.name.trim()) {
      Alert.alert('Hata', 'Lütfen bir lig ismi belirleyin.');
      return false;
    }

    setIsSubmitting(true);
    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // 1. Ligi oluştur (Tip: League)
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .insert([{
          name: form.name.trim(),
          admin_id: userProfile?.id,
          win_points: parseInt(form.winPoints),
          draw_points: parseInt(form.drawPoints),
          loss_points: parseInt(form.lossPoints),
          format: form.isDoubleRound ? 'double' : 'single',
          status: 'lobby' as LeagueStatus,
          invite_code: inviteCode,
        }])
        .select()
        .single();

      if (leagueError) throw leagueError;

      // 2. Katılımcı ekle
      const { error: participantError } = await supabase
        .from('league_participants')
        .insert([{
          league_id: league.id,
          user_id: userProfile?.id,
          team_name: userProfile?.username || 'Admin',
        }]);

      if (participantError) throw participantError;

      setCurrentLeagueId(league.id);
      return true;
    } catch (error: any) {
      handleAppError(error, "CreateLeague"); // Merkezi hata yönetimi
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LİGE KATILMA ---
  const joinLeague = async (inviteCode: string) => {
    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      Alert.alert('Hata', 'Lütfen bir davet kodu girin.');
      return false;
    }

    setIsSubmitting(true);
    try {
      // 1. Ligi bul (.maybeSingle kullanarak hatayı engelliyoruz)
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('id, name, status')
        .eq('invite_code', code)
        .maybeSingle(); // Kayıt yoksa hata fırlatmaz, null döner.

      // Supabase sorgu hatası (Bağlantı vb.)
      if (leagueError) {
        handleAppError(leagueError, "JoinLeague - Fetch");
        return false;
      }

      // Kayıt bulunamadıysa manuel Alert veriyoruz (throw yapmadan)
      if (!league) {
        Alert.alert('Hata', 'Girdiğiniz davet kodu geçersiz.');
        return false;
      }

      if (league.status !== 'lobby') {
        Alert.alert('Uyarı', 'Bu lig zaten başlamış veya kapanmış.');
        return false;
      }

      // 2. Mevcut katılım kontrolü
      const { data: existing, error: existingError } = await supabase
        .from('league_participants')
        .select('id')
        .eq('league_id', league.id)
        .eq('user_id', userProfile?.id)
        .maybeSingle();

      if (existing) {
        setCurrentLeagueId(league.id);
        return true;
      }

      // 3. Katılım kaydı
      const { error: joinError } = await supabase
        .from('league_participants')
        .insert([{
          league_id: league.id,
          user_id: userProfile?.id,
          team_name: userProfile?.username || 'Yeni Oyuncu',
        }]);

      if (joinError) {
        handleAppError(joinError, "JoinLeague - Insert");
        return false;
      }

      setCurrentLeagueId(league.id);
      return true;

    } catch (error: any) {
      // Beklenmedik bir JS hatası olursa burası yakalar
      handleAppError(error, "JoinLeague - Global");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createLeague, joinLeague, isSubmitting };
};