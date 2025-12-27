import { supabase } from '@/api/supabase';
import { useLeagueStore } from '@/store/useLeagueStore';
import { Match, Participant } from '@/types/database';
import { useQuery } from '@tanstack/react-query';

export const useUserMatches = () => {
    const userProfile = useLeagueStore((state) => state.userProfile);
    const currentLeagueId = useLeagueStore((state) => state.currentLeagueId);

    return useQuery({
        queryKey: ['user-matches', userProfile?.id, currentLeagueId],
        enabled: !!userProfile?.id && !!currentLeagueId,
        queryFn: async () => {
            // 1. Paralel Veri Çekme (Performans için aynı anda başlatıyoruz)
            const [matchesResponse, participantsResponse] = await Promise.all([
                supabase
                    .from('matches')
                    .select('*')
                    .eq('league_id', currentLeagueId)
                    .or(`home_user_id.eq.${userProfile?.id},away_user_id.eq.${userProfile?.id}`)
                    .order('match_order', { ascending: false }),

                supabase
                    .from('league_participants')
                    .select('*')
                    .eq('league_id', currentLeagueId)
            ]);

            if (matchesResponse.error) throw matchesResponse.error;
            if (participantsResponse.error) throw participantsResponse.error;

            const rawMatches = matchesResponse.data as Match[];
            const participants = participantsResponse.data as Participant[];

            // 2. Data Mapping (O(1) hızında erişim için katılımcıları sözlüğe çeviriyoruz)
            // Senior Notu: Dizi içinde find yapmak yerine Map kullanmak büyük veride daha hızlıdır.
            const participantMap = new Map(participants.map(p => [p.user_id, p]));

            const enrichedMatches: Match[] = rawMatches.map(match => ({
                ...match,
                home_participant: participantMap.get(match.home_user_id),
                away_participant: participantMap.get(match.away_user_id)
            }));

            return enrichedMatches;
        },
        staleTime: 0, // Veri alındığı an stale kabul edilir.
        gcTime: 1000 * 60 * 30, // Cache'i hafızada 30 dk tut ama taze sayma.
        refetchOnMount: true, // Bileşen her render olduğunda (ekran açıldığında) kontrol et.
    });
};