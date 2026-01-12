import { supabase } from '@/api/supabase';
import { LeagueStatus, Profile } from '@/types/database';
import { create } from 'zustand';


export interface ProfileWithLogo extends Profile {
  logo_url?: string;
  favorite_team_id?: string;
  favorite_team?: string;
}

interface LeagueState {
  currentLeagueId: string | null | undefined;
  leagueStatus: LeagueStatus | null;
  userProfile: ProfileWithLogo | null;
  isLoading: boolean;
  setCurrentLeagueId: (id: string | null) => void;
  setUserProfile: (profile: ProfileWithLogo | null) => void;
  fetchProfile: (userId: string) => Promise<void>;
  syncActiveLeague: (userId: string) => Promise<void>;
  logout: () => void;
}

export const useLeagueStore = create<LeagueState>((set) => ({
  currentLeagueId: undefined,
  leagueStatus: null,
  userProfile: null,
  isLoading: false,

  setCurrentLeagueId: (id) => set({ currentLeagueId: id }),

  // useLeagueStore.ts içindeki ilgili kısım
  setUserProfile: (profile) => set((state) => {
    if (!profile) return { userProfile: null };

    return {
      userProfile: {
        ...profile,
        // Eğer yeni gelen veride logo varsa onu kullan, yoksa eskini koru
        logo_url: profile.logo_url || state.userProfile?.logo_url
      }
    };
  }),

  // profil ve logoyu ilişkisel olarak çek
  fetchProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
        *,
        official_teams:favorite_team_id (
          logo_url
        )
      `)
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        const logo = (data as any).official_teams?.logo_url;

        const formattedProfile: ProfileWithLogo = {
          ...data,
          logo_url: logo // logoyu zorla yaz
        };

        set({ userProfile: formattedProfile });
      }
    } catch (error) {
      console.error("Fetch Profile Error:", error);
    }
  },

  // aktif lig senkranizasyonu
  syncActiveLeague: async (userId: string) => {
    set({ isLoading: true, currentLeagueId: undefined });
    try {
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

      const { data: activeLeagues, error: lError } = await supabase
        .from('leagues')
        .select('id, status')
        .in('id', leagueIds)
        .in('status', ['lobby', 'active'])
        .maybeSingle();

      if (lError) throw lError;

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