import { supabase } from '@/api/supabase';
import { useQuery } from '@tanstack/react-query';

export const usePastLeagueDetails = (leagueId: string | null) => {
  return useQuery({
    queryKey: ['past-league-standings', leagueId],
    enabled: !!leagueId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('league_participants')
        .select(`
          id,
          team_name,
          played,
          won,
          drawn,
          lost,
          goals_for,
          goals_against,
          points,
          motm_count,
          user_id,
          profiles (username)
        `)
        .eq('league_id', leagueId)
        .order('points', { ascending: false })
        .order('goals_for', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};