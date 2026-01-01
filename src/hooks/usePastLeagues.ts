import { supabase } from '@/api/supabase';
import { useLeagueStore } from '@/store/useLeagueStore';
import { useQuery } from '@tanstack/react-query';

export const usePastLeagues = () => {
  const userProfile = useLeagueStore((state) => state.userProfile);

  // useQuery sonucunu bir değişkene ata
  const queryResult = useQuery({
    queryKey: ['past-leagues', userProfile?.id],
    enabled: !!userProfile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('league_participants')
        .select(`
          id,
          team_name,
          leagues!inner (
            id,
            name,
            status,
            created_at
          )
        `)
        .eq('user_id', userProfile?.id)
        .eq('leagues.status', 'completed')
        .order('id', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return {
    data: queryResult.data,
    isLoading: queryResult.isLoading,
    refetch: queryResult.refetch
  };
};