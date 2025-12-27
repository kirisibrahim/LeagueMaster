import { supabase } from '@/api/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useLobby(leagueId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['lobby', leagueId],
    queryFn: async () => {
      if (!leagueId) return null;

      // Performans için iki sorguyu aynı anda başlatıyoruz
      const [leagueRes, participantsRes] = await Promise.all([
        supabase.from('leagues').select('*').eq('id', leagueId).single(),
        supabase.from('league_participants').select('*').eq('league_id', leagueId)
      ]);

      if (leagueRes.error) throw leagueRes.error;

      return {
        league: leagueRes.data,
        participants: participantsRes.data || [],
      };
    },
    enabled: !!leagueId,
    staleTime: 1000 * 60 * 5,
  });

  // Realtime Dinleyici: Katılımcı veya Lig durumu değiştiğinde Dashboard'u tetikler
  useEffect(() => {
    if (!leagueId) return;

    console.log("Realtime dinleyici başlatıldı, Lig ID:", leagueId);

    const channel = supabase
      .channel(`lobby-realtime-${leagueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'league_participants',
          filter: `league_id=eq.${leagueId}`
        },
        (payload) => {
          console.log("Katılımcı değişikliği sinyali geldi:", payload);
          queryClient.invalidateQueries({ queryKey: ['lobby', leagueId] });
          queryClient.invalidateQueries({ queryKey: ['standings', leagueId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leagues',
          filter: `id=eq.${leagueId}`
        },
        (payload) => {
          console.log("!!! LİG DURUMU GÜNCELLENDİ (LOBİ -> AKTİF) !!!", payload);

          // 1. ÖNEMLİ: Kendi verisini (lobby query) güncelle! 
          // DashboardView'daki 'lobbyData' buradan besleniyor.
          queryClient.setQueryData(['lobby', leagueId], (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              league: payload.new // Yeni lig verisini (status: active) buraya enjekte et
            };
          });

          // 2. Diğer anahtarı da güncelle (DashboardView'daki 'league' değişkeni için)
          queryClient.setQueryData(['league_details', leagueId], payload.new);

          // 3. Tüm sistemi sars
          queryClient.invalidateQueries({ queryKey: ['lobby', leagueId] });
          queryClient.invalidateQueries({ queryKey: ['league_details', leagueId] });
          queryClient.invalidateQueries({ queryKey: ['nextMatch', leagueId] });
        }
      )
      .subscribe((status) => {
        console.log("Realtime bağlantı durumu:", status);
      });

    return () => {
      console.log("Realtime kanalı kapatılıyor...");
      supabase.removeChannel(channel);
    };
  }, [leagueId, queryClient]);

  return query;
}