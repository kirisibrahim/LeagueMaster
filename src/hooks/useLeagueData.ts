import { supabase } from '@/api/supabase';
import { League, Match, Participant } from '@/types/database';
import { handleAppError } from '@/utils/errorHandler';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// puan durumu çeken hook
export const useStandings = (leagueId: string | null) => {
  return useQuery<Participant[]>({
    queryKey: ['standings', leagueId],
    queryFn: async () => {
      if (!leagueId) return [];
      const { data, error } = await supabase
        .from('league_participants')
        .select('*, profiles(username)')
        .eq('league_id', leagueId)
        .order('points', { ascending: false })
        .order('goals_for', { ascending: false });

      if (error) throw error;
      return data as Participant[];
    },
    enabled: !!leagueId,
    staleTime: 1000 * 60 * 5,
  });
};

// lig detaylarını çeken hook
export const useLeagueDetails = (leagueId: string | null) => {
  return useQuery<League | null>({
    queryKey: ['league_details', leagueId],
    queryFn: async () => {
      if (!leagueId) return null;
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', leagueId)
        .maybeSingle();

      if (error) throw error;
      return data as League;
    },
    enabled: !!leagueId,
    retry: 1,
  });
};

// sıradaki oynanacak maçı çeken hook
export const useNextMatch = (leagueId: string | null) => {
  return useQuery<Match | null>({
    queryKey: ['nextMatch', leagueId],
    queryFn: async () => {
      if (!leagueId) return null;

      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('league_id', leagueId)
        .eq('is_completed', false)
        .order('match_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (matchError || !match) return null;

      // katılımcı bilgilerini çek
      const { data: participants, error: pError } = await supabase
        .from('league_participants')
        .select('user_id, team_name, profiles(username)')
        .eq('league_id', leagueId)
        .in('user_id', [match.home_user_id, match.away_user_id]);

      if (pError || !participants) return match as Match;

      return {
        ...match,
        home_participant: participants.find(p => p.user_id === match.home_user_id),
        away_participant: participants.find(p => p.user_id === match.away_user_id)
      } as Match;
    },
    enabled: !!leagueId,
  });
};

// tüm fikstürü çeken hook
export const useFullFixture = (leagueId: string | null) => {
  return useQuery<Match[]>({
    queryKey: ['fullFixture', leagueId],
    queryFn: async () => {
      if (!leagueId) return [];

      const { data: matches, error: mError } = await supabase
        .from('matches')
        .select('*')
        .eq('league_id', leagueId)
        .order('match_order', { ascending: true });

      if (mError) throw mError;

      const { data: participants } = await supabase
        .from('league_participants')
        .select('user_id, team_name')
        .eq('league_id', leagueId);

      return matches.map(match => ({
        ...match,
        home_participant: participants?.find(p => p.user_id === match.home_user_id),
        away_participant: participants?.find(p => p.user_id === match.away_user_id),
      })) as Match[];
    },
    enabled: !!leagueId,
  });
};

// skor güncelleme mutasyon motm destekki
export const useUpdateMatchScore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      homeScore,
      awayScore,
      motmId
    }: {
      matchId: string;
      homeScore: number;
      awayScore: number;
      motmId: string | null
    }) => {
      const { error } = await supabase
        .from('matches')
        .update({
          home_score: homeScore,
          away_score: awayScore,
          is_completed: true,
          status: 'completed',
          motm_user_id: motmId,
          played_at: new Date().toISOString() // raporlama için maçın tamamlanma zamanı
        })
        .eq('id', matchId);

      if (error) throw error;
    },
    onSuccess: async () => {
      // ilgili verileri paralel olarak yenile
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['nextMatch'] }),
        queryClient.invalidateQueries({ queryKey: ['standings'] }),
        queryClient.invalidateQueries({ queryKey: ['fullFixture'] }),
        queryClient.invalidateQueries({ queryKey: ['league_details'] }),
        queryClient.invalidateQueries({ queryKey: ['user-matches'], exact: false })
      ]);
    },
  });
};

// meaçı geri al mutasyon
export const useUndoMatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchId: string) => {
      const { error } = await supabase
        .from('matches')
        .update({
          home_score: 0,
          away_score: 0,
          is_completed: false,
          status: 'pending'
        })
        .eq('id', matchId);

      if (error) throw error;
    },
    onSuccess: async () => {
      // tüm sorguları aynı anda ve bekleyerek yenile
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['nextMatch'] }),
        queryClient.invalidateQueries({ queryKey: ['standings'] }),
        queryClient.invalidateQueries({ queryKey: ['fullFixture'] }),
        queryClient.invalidateQueries({ queryKey: ['league_details'] }),
        // kişisel maç geçmişini de tazele
        queryClient.invalidateQueries({ queryKey: ['user-matches'], exact: false })
      ]);
      // console.log("Maç geri alındı ve veriler tazelendi.");
    },
    onError: (error: any) => {
      handleAppError(error, "UndoMatch");
    }
  });
};

export const useUserMatches = (leagueId: string, userId: string) => {
  return useQuery({
    queryKey: ['userMatches', leagueId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_participant:league_participants!matches_home_user_id_fkey(team_name),
          away_participant:league_participants!matches_away_user_id_fkey(team_name)
        `)
        .eq('league_id', leagueId)
        .or(`home_user_id.eq.${userId},away_user_id.eq.${userId}`) // Sadece kullanıcının olduğu maçlar
        .order('match_order', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};