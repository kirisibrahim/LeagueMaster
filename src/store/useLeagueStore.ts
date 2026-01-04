import { supabase } from '@/api/supabase';
import { LeagueStatus, Profile } from '@/types/database';
import { create } from 'zustand';

// profile tipini logo_url ekleyerek genişlet
export interface ProfileWithLogo extends Profile {
  logo_url?: string;
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

  setUserProfile: (profile) => set((state) => ({
    userProfile: profile
      ? {
        ...profile,
        // gelen veri de logo yoksa state deki logoyu koru
        logo_url: (profile as any).logo_url || state.userProfile?.logo_url
      }
      : null
  })),

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

        // console.log("✅ Final Profile Object Set:", JSON.stringify(formattedProfile, null, 2));
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