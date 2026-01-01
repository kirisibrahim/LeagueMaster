import { supabase } from '@/api/supabase';
import { useLeagueStore } from '@/store/useLeagueStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useUserCareer = () => {
  const queryClient = useQueryClient();
  const userProfile = useLeagueStore((state) => state.userProfile);

  // Kariyer verilerini çek
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['user-career-stats', userProfile?.id],
    enabled: !!userProfile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_career_stats')
        .select('*')
        .eq('user_id', userProfile?.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // İstatistikleri Sıfırlama Mutasyonu
  const resetStats = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('user_career_stats')
        .update({
          total_matches: 0,
          total_wins: 0,
          total_draws: 0,
          total_losses: 0,
          goals_for: 0,
          goals_against: 0,
          total_mvp: 0,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userProfile?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-career-stats', userProfile?.id] });
    }
  });

  return { stats, isLoading, resetStats, refetch };
};