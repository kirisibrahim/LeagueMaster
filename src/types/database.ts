export type LeagueStatus = 'lobby' | 'active' | 'finished';
export type MatchStatus = 'pending' | 'completed';

export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  favorite_team?: string;
  updated_at?: string;
}

export interface League {
  id: string;
  admin_id: string;
  name: string;
  format: 'single' | 'double';
  win_points: number;
  draw_points: number;
  loss_points: number;
  invite_code: string;
  status: LeagueStatus;
  current_match_order: number;
  created_at: string;
}

export interface Participant {
  id: string;
  league_id: string;
  user_id: string;
  team_name: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  motm_count: number;
  profiles?: Profile; // Join sorguları için
}

export interface Match {
  id: string;
  league_id: string;
  home_user_id: string;
  away_user_id: string;
  home_score: number | null;
  away_score: number | null;
  is_completed: boolean;
  played_at: string | null;
  round_number: number;
  match_order: number;
  status: MatchStatus;
  motm_user_id: string | null;
  home_participant?: Participant;
  away_participant?: Participant;
}