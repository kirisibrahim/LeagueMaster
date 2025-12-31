import { supabase } from '@/api/supabase';
import { LeagueStatus, Profile } from '@/types/database';
import { create } from 'zustand';

interface LeagueState {
  currentLeagueId: string | null | undefined;
  leagueStatus: LeagueStatus | null;
  userProfile: Profile | null;
  isLoading: boolean;
  setCurrentLeagueId: (id: string | null) => void;
  setUserProfile: (profile: Profile | null) => void;
  syncActiveLeague: (userId: string) => Promise<void>;
  logout: () => void;
}

export const useLeagueStore = create<LeagueState>((set) => ({
  currentLeagueId: undefined,
  leagueStatus: null,
  userProfile: null,
  isLoading: false,

  setCurrentLeagueId: (id) => set({ currentLeagueId: id }),

  setUserProfile: (profile) => set({ userProfile: profile }),

  syncActiveLeague: async (userId: string) => {
    set({ isLoading: true, currentLeagueId: undefined });
    try {
      // kullanıcın nkatıldığı tğm linklerin idleri
      const { data: participations, error: pError } = await supabase
        .from('league_participants')
        .select('league_id')
        .eq('user_id', userId);

      if (pError) throw pError;

      if (!participations || participations.length === 0) {
        set({ currentLeagueId: null, leagueStatus: null, isLoading: false });
        return;
      }

      const leagueIds = participations.map(p => p.league_id);

      // bu idlerden sadece active ve lobby olanı getir
      // .in('status', [...]) kullanarak completed olanları kesin dışarıda bırakıyoruz
      const { data: activeLeagues, error: lError } = await supabase
        .from('leagues')
        .select('id, status')
        .in('id', leagueIds)
        .in('status', ['lobby', 'active']) // completed yok
        .maybeSingle();

      if (lError) throw lError;

      // aktif lig bulunduysa set et bulunamadıysa tertemiz yap
      if (activeLeagues) {
        set({
          currentLeagueId: activeLeagues.id,
          leagueStatus: activeLeagues.status as LeagueStatus
        });
      } else {
        set({ currentLeagueId: null, leagueStatus: null });
      }
    } catch (error) {
      console.error("Sync Error:", error);
      set({ currentLeagueId: null, leagueStatus: null });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => set({
    currentLeagueId: null,
    leagueStatus: null,
    userProfile: null,
    isLoading: false
  }),
}));