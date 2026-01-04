import { supabase } from '@/api/supabase';
import { useLeagueStore } from '@/store/useLeagueStore';
import { useEffect, useState } from 'react';

export const useInitialCheck = () => {
  const [isChecking, setIsChecking] = useState(true);
  const { setCurrentLeagueId, setUserProfile } = useLeagueStore();

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // profil bilgisini store'a yaz
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) setUserProfile(profile);

        // lig katılımını kontrol et ve store'a yaz
        const { data: participant } = await supabase
          .from('league_participants')
          .select('league_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (participant?.league_id) {
          setCurrentLeagueId(participant.league_id);
        }
      } catch (error) {
        console.error("Initial Check Error:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkUserStatus();
  }, []);

  return { isChecking };
};