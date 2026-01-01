import { supabase } from '@/api/supabase';
import { useLeagueStore } from '@/store/useLeagueStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { LeagueStatus } from '@/types/database';
import { handleAppError } from '@/utils/errorHandler';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export const useLeagueActions = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userProfile, setCurrentLeagueId } = useLeagueStore();
  const queryClient = useQueryClient();
  const { showNotification, showConfirm } = useNotificationStore();

  // lig oluşturrma
  const createLeague = async (form: {
    name: string;
    teamName: string;
    winPoints: string;
    drawPoints: string;
    lossPoints: string;
    isDoubleRound: boolean;
  }) => {
    if (!form.name.trim() || !form.teamName.trim()) {
      showNotification('Lütfen bir lig ismi ve seçtiğiniz takımın ismini belirleyin.');
      return false;
    }

    setIsSubmitting(true);
    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // league tipinde oluştur
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

      // katılımcı ekle
      const { error: participantError } = await supabase
        .from('league_participants')
        .insert([{
          league_id: league.id,
          user_id: userProfile?.id,
          team_name: form.teamName.trim(),
        }]);

      if (participantError) throw participantError;

      setCurrentLeagueId(league.id);
      return true;
    } catch (error: any) {
      handleAppError(error, "CreateLeague");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // lige katılma
  const joinLeague = async (inviteCode: string, teamName: string) => {
    const code = inviteCode.trim().toUpperCase();
    const selectedTeam = teamName.trim();

    if (!code) {
      showNotification('Lütfen bir davet kodu girin.');
      return false;
    }

    if (!selectedTeam) {
      showNotification('Lütfen bir takım ismi seçin.');
      return false;
    }

    setIsSubmitting(true);
    try {
      // ligi bul
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('id, name, status')
        .eq('invite_code', code)
        .maybeSingle(); // Kayıt yoksa hata fırlatmaz, null döner.

      // supabase sorgu hatası
      if (leagueError) {
        handleAppError(leagueError, "JoinLeague - Fetch");
        return false;
      }

      // kayıt yoksa manuel alert
      if (!league) {
        showNotification('Girdiğiniz davet kodu geçersiz.');
        return false;
      }

      if (league.status !== 'lobby') {
        showNotification('Bu lig zaten başlamış veya kapanmış.');
        return false;
      }

      // mevcut katılım kontrolü
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

      // katılım kaydı
      const { error: joinError } = await supabase
        .from('league_participants')
        .insert([{
          league_id: league.id,
          user_id: userProfile?.id,
          team_name: selectedTeam,
        }]);

      if (joinError) {
        handleAppError(joinError, "JoinLeague - Insert");
        return false;
      }

      setCurrentLeagueId(league.id);
      return true;

    } catch (error: any) {
      // beklenmedik js hatası yakala
      handleAppError(error, "JoinLeague - Global");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishTournament = async (league_id: string) => {
    if (!league_id) return false;

    setIsSubmitting(true);
    try {
      // veritabanı motoru çalıştır
      const { error: rpcError } = await supabase.rpc('complete_league_and_update_stats', {
        p_league_id: league_id
      });

      if (rpcError) throw rpcError;

      // removeQueries önbellekteki veriyi saniyeler içinde uçurur
      queryClient.removeQueries({ queryKey: ['user-matches'] });
      queryClient.removeQueries({ queryKey: ['league_details', league_id] });
      queryClient.removeQueries({ queryKey: ['standings', league_id] });

      // kariyer istatistiklerini yenile çünkü lig bitti, rakamlar arttı
      await queryClient.invalidateQueries({ queryKey: ['user-career-stats'] });

      // store sıfırla
      setCurrentLeagueId(null);

      showNotification("🏆 Tüm veriler başarıyla işlendi ve lig arşive kaldırıldı.");

      return true;
    } catch (error: any) {
      handleAppError(error, "FinishTournament");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ligi tamamen siler (Sadece Admin için)
  const deleteLeague = async (leagueId: string) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('leagues')
        .delete()
        .eq('id', leagueId);

      if (error) throw error;

      // Önbelleği temizle ve store'u sıfırla
      queryClient.clear();
      setCurrentLeagueId(null);
      return true;
    } catch (error: any) {
      handleAppError(error, "DeleteLeague");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Katılımcıyı ligden çıkarır (Oyuncu kendisi çıkar)
  const leaveLeague = async (leagueId: string, userId: string) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('league_participants')
        .delete()
        .eq('league_id', leagueId)
        .eq('user_id', userId);

      if (error) throw error;

      // Kullanıcıyı ana ekrana döndür
      queryClient.invalidateQueries({ queryKey: ['lobby', leagueId] });
      setCurrentLeagueId(null);
      return true;
    } catch (error: any) {
      handleAppError(error, "LeaveLeague");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createLeague,
    joinLeague,
    finishTournament,
    deleteLeague,
    leaveLeague,
    isSubmitting
  };
};