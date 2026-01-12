import { supabase } from '@/api/supabase';
import { useLeagueStore } from '@/store/useLeagueStore';
import { useQuery } from '@tanstack/react-query';

export const useUserMatches = () => {
    const userProfile = useLeagueStore((state) => state.userProfile);
    const currentLeagueId = useLeagueStore((state) => state.currentLeagueId);

    return useQuery({
        queryKey: ['user-matches', currentLeagueId, userProfile?.id],
        enabled: !!userProfile?.id && !!currentLeagueId,
        queryFn: async () => {
            if (!currentLeagueId || !userProfile?.id) return [];

            const [matchesResponse, participantsResponse] = await Promise.all([
                supabase
                    .from('matches')
                    .select('*')
                    .eq('league_id', currentLeagueId)
                    .or(`home_user_id.eq.${userProfile.id},away_user_id.eq.${userProfile.id}`)
                    .order('match_order', { ascending: true }),

                supabase
                    .from('league_participants')
                    .select(`
                        *,
                        profiles (
                            username,
                            avatar_url
                        ),
                        official_teams:team_id (
                            logo_url
                        )
                    `) // official_teams'den logo_url alıyoruz
                    .eq('league_id', currentLeagueId)
            ]);

            if (matchesResponse.error) throw matchesResponse.error;
            if (participantsResponse.error) throw participantsResponse.error;

            const participantMap = new Map(participantsResponse.data?.map(p => [p.user_id, p]) || []);

            return matchesResponse.data.map(match => ({
                ...match,
                // Haritalama yaparken katılımcı verisi tam olarak gelecek
                home_participant: participantMap.get(match.home_user_id),
                away_participant: participantMap.get(match.away_user_id)
            })) as any[]; // tipleme hatasını önlemek için geçici any 
        },
        staleTime: 1000 * 60 * 2, // 2 dakika cache'de, veri değiştikçe queryClient.invalidate kullanırız
    });
};