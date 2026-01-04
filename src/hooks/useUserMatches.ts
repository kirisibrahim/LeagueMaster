import { supabase } from '@/api/supabase';
import { useLeagueStore } from '@/store/useLeagueStore';
import { Match } from '@/types/database';
import { useQuery } from '@tanstack/react-query';

export const useUserMatches = () => {
    const userProfile = useLeagueStore((state) => state.userProfile);
    const currentLeagueId = useLeagueStore((state) => state.currentLeagueId);

    return useQuery({
        queryKey: ['user-matches', currentLeagueId, userProfile?.id],
        enabled: !!userProfile?.id && !!currentLeagueId,
        queryFn: async () => {
            if (!currentLeagueId) return [];

            const [matchesResponse, participantsResponse] = await Promise.all([
                supabase
                    .from('matches')
                    .select('*')
                    .eq('league_id', currentLeagueId)
                    .or(`home_user_id.eq.${userProfile?.id},away_user_id.eq.${userProfile?.id}`)
                    .order('match_order', { ascending: true }),
                supabase
                    .from('league_participants')
                    .select(`
                        *,
                        profiles (
                            username,
                            avatar_url
                        )
                    `) // profiles tablosunu join yaparak kullanıcı adını aldık
                    .eq('league_id', currentLeagueId)
            ]);

            if (matchesResponse.error) throw matchesResponse.error;
            const participantMap = new Map(participantsResponse.data?.map(p => [p.user_id, p]) || []);

            return matchesResponse.data.map(match => ({
                ...match,
                home_participant: participantMap.get(match.home_user_id),
                away_participant: participantMap.get(match.away_user_id)
            })) as Match[];
        },
        // veriyi sadece mevcut lig ID'sine uygunsa teslim et
        select: (data) => {
            if (!currentLeagueId) return [];
            return data.filter(m => String(m.league_id) === String(currentLeagueId));
        },
        staleTime: 0,
        gcTime: 0,
    });
};