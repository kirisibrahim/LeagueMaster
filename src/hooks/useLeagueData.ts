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

      // canlı puan durumu verilerini rpc ile al
      const { data: calculatedData, error: rpcError } = await supabase
        .rpc('get_live_standings', { l_id: leagueId });

      if (rpcError) throw rpcError;

      // logo kullanıcı adı gibi statik veriler
      const { data: staticData, error: pError } = await supabase
        .from('league_participants')
        .select('user_id, motm_count, profiles(username), official_teams:team_id(logo_url)')
        .eq('league_id', leagueId);

      if (pError) throw pError;

      // verileri harmanla
      return calculatedData.map((calc: any) => {
        const extra = staticData?.find((s) => s.user_id === calc.user_id);
        return {
          ...calc,
          motm_count: extra?.motm_count || 0,
          profiles: extra?.profiles,
          official_teams: extra?.official_teams,
          goal_difference: (calc.goals_for || 0) - (calc.goals_against || 0)
        };
      }) as Participant[];
    },
    enabled: !!leagueId,
    staleTime: 0,
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
        .select('user_id, team_name, profiles(username), official_teams:team_id(logo_url)')
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
        .select('user_id, team_name, official_teams:team_id(logo_url)')
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

// maç başlatama mutasyonu Status =  pending -> live
export const useStartMatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (matchId: string) => {
      const { error } = await supabase
        .from('matches')
        .update({ status: 'live' })
        .eq('id', matchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nextMatch'] });
      queryClient.invalidateQueries({ queryKey: ['fullFixture'] });
    },
  });
};

// canlı skor güncelleme maçı bitirmeden tabloyu günceller
export const useUpdateLiveScore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ matchId, homeScore, awayScore }: { matchId: string, homeScore: number, awayScore: number }) => {
      const { error } = await supabase
        .from('matches')
        .update({
          home_score: homeScore,
          away_score: awayScore,
        })
        .eq('id', matchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standings'] });
      queryClient.invalidateQueries({ queryKey: ['nextMatch'] });
    },
  });
};

// skor güncelleme mutasyon
export const useUpdateMatchScore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      homeScore,
      awayScore,
      motmId,
      status = 'live'
    }: {
      matchId: string;
      homeScore: number;
      awayScore: number;
      motmId: string | null;
      status?: 'live' | 'completed';
    }) => {
      // dinamik güncelleme 
      const updateData: any = {
        home_score: homeScore,
        away_score: awayScore,
        status: status,
        is_completed: status === 'completed',
      };

      // maç bittiyse ek alanları ekle
      if (status === 'completed') {
        updateData.motm_user_id = motmId;
        updateData.played_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', matchId);

      if (error) throw error;
    },
    onSuccess: async () => {
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
          status: 'pending',
          motm_user_id: null
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
        .or(`home_user_id.eq.${userId},away_user_id.eq.${userId}`) // sadece kullanıcın maçları
        .order('match_order', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};