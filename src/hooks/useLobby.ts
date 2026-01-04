import { supabase } from '@/api/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useLobby(leagueId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['lobby', leagueId],
    queryFn: async () => {
      if (!leagueId) return null;

      // üç sorguyu aynı anda lig katılımcılar ve resmi takımlar
      const [leagueRes, participantsRes, teamsRes] = await Promise.all([
        supabase.from('leagues').select('*').eq('id', leagueId).single(),
        supabase.from('league_participants').select('*, profiles(username)').eq('league_id', leagueId),
        supabase.from('official_teams').select('id, logo_url')
      ]);

      if (leagueRes.error) throw leagueRes.error;
      if (participantsRes.error) throw participantsRes.error;

      // takımları eşleştirmek için map (performans)
      const teamLogosMap = new Map(
        teamsRes.data?.map(team => [team.id, team.logo_url]) || []
      );

      // katılımcılara logoları manuel yerleştirme
      const participantsWithLogos = (participantsRes.data || []).map(p => ({
        ...p,
        official_teams: {
          logo_url: teamLogosMap.get(p.team_id) || null
        }
      }));

      return {
        league: leagueRes.data,
        participants: participantsWithLogos,
      };
    },
    enabled: !!leagueId,
    staleTime: 0,
    gcTime: 0,
  });

  // realtime: katılımcı veya lig durumu değiştiğinde dashboardu tetikle
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