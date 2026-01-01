// api/teams.ts
import { supabase } from './supabase';

export const searchOfficialTeams = async (searchTerm: string) => {
  if (searchTerm.length < 2) return []; // 2 harften azsa arama yapma

  const { data, error } = await supabase
    .from('official_teams')
    .select('id, name, logo_url')
    .ilike('name', `%${searchTerm}%`) // Büyük/küçük harf duyarsız arama
    .limit(15); // UI yormamak için limitliyoruz

  if (error) {
    console.error('Takım arama hatası:', error);
    return [];
  }
  return data;
};