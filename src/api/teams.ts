import { supabase } from './supabase';

export const searchOfficialTeams = async (searchTerm: string) => {
  if (searchTerm.length < 2) return []; // 2 harften azsa arama yapma

  const { data, error } = await supabase
    .from('official_teams')
    .select('id, name, logo_url')
    .ilike('name', `%${searchTerm}%`) // büyük küçük harf duyarsız
    .limit(15); // UI yorulmasın limit

  if (error) {
    console.error('Takım arama hatası:', error);
    return [];
  }
  return data;
};