import { supabase } from '@/api/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useLobby(leagueId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['lobby', leagueId],
    queryFn: async () => {
      if (!leagueId) return null;

      // performan için iki sorgu aynı anda
      const [leagueRes, participantsRes] = await Promise.all([
        supabase.from('leagues').select('*').eq('id', leagueId).single(),
        supabase.from('league_participants')
          .select('*, profiles(username)')
          .eq('league_id', leagueId)
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

  // Realtime Dinleyici: katılımcı veya lig durumu değiştiğinde dashboardu tetikler
  useEffect(() => {
    if (!leagueId) return;

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
          queryClient.setQueryData(['lobby', leagueId], (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              league: payload.new
            };
          });

          queryClient.setQueryData(['league_details', leagueId], payload.new);

          // sistemi sars
          queryClient.invalidateQueries({ queryKey: ['lobby', leagueId] });
          queryClient.invalidateQueries({ queryKey: ['league_details', leagueId] });
          queryClient.invalidateQueries({ queryKey: ['nextMatch', leagueId] });
        }
      )
      .subscribe((status) => {
        // console.log("Realtime bağlantı durumu:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leagueId, queryClient]);

  return query;
}