import { supabase } from '@/api/supabase';
import { LeagueStatus, Profile } from '@/types/database';
import { create } from 'zustand';

interface LeagueState {
  currentLeagueId: string | null;
  leagueStatus: LeagueStatus | null;
  userProfile: Profile | null;
  isLoading: boolean;
  setCurrentLeagueId: (id: string | null) => void;
  setUserProfile: (profile: Profile | null) => void;
  syncActiveLeague: (userId: string) => Promise<void>;
  logout: () => void;
}

export const useLeagueStore = create<LeagueState>((set) => ({
  currentLeagueId: null,
  leagueStatus: null,
  userProfile: null,
  isLoading: true,

  setCurrentLeagueId: (id) => set({ currentLeagueId: id }),
  
  setUserProfile: (profile) => set({ userProfile: profile }),

  syncActiveLeague: async (userId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('league_participants')
        .select(`
          league_id,
          leagues!inner ( status )
        `)
        .eq('user_id', userId)
        .neq('leagues.status', 'finished')
        .maybeSingle();

      if (data && data.league_id) {
        set({ 
          currentLeagueId: data.league_id,
          leagueStatus: (data.leagues as any).status as LeagueStatus 
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