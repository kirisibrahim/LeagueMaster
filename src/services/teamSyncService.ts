import { supabase } from '@/api/supabase';

const API_KEY = process.env.EXPO_PUBLIC_FOOTBALL_API_KEY;
const BASE_URL = process.env.EXPO_PUBLIC_FOOTBALL_API_URL;

export const syncCompleteLeague = async (leagueApiId: number) => {
  if (!API_KEY || !BASE_URL) {
    console.error("❌ HATA: API Yapılandırması (Key veya URL) .env dosyasında bulunamadı.");
    return false;
  }
  try {
    const requestHeaders: HeadersInit = {
      'x-apisports-key': API_KEY,
      'Content-Type': 'application/json'
    };

    // lig bilgisini çek ve official_leagues tablosuna kaydet
    const leagueRes = await fetch(`${BASE_URL}/leagues?id=${leagueApiId}`, {
      headers: requestHeaders
    });

    if (!leagueRes.ok) throw new Error(`Lig çekilemedi: ${leagueRes.statusText}`);
    
    const leagueData = await leagueRes.json();
    let dbLeagueUuid: string | null = null;
    
    if (leagueData.response?.[0]) {
      const { data: savedLeague, error: lError } = await supabase
        .from('official_leagues')
        .upsert({
          name: leagueData.response[0].league.name,
          logo_url: leagueData.response[0].league.logo,
          country: leagueData.response[0].country.name,
          api_id: leagueApiId
        }, { onConflict: 'api_id' })
        .select()
        .single();
      
      if (lError) throw lError;
      dbLeagueUuid = savedLeague.id; 
    }

    // takımları çek ve aldığımız UUID ile official_teams tablosuna kaydet
    // 2023 sezonu takımları çekiliyor
    const teamRes = await fetch(`${BASE_URL}/teams?league=${leagueApiId}&season=2023`, {
      headers: requestHeaders
    });

    if (!teamRes.ok) throw new Error(`Takımlar çekilemedi: ${teamRes.statusText}`);
    
    const teamData = await teamRes.json();

    if (teamData.response && teamData.response.length > 0 && dbLeagueUuid) {
      const formattedTeams = teamData.response.map((item: any) => ({
        name: item.team.name,
        logo_url: item.team.logo,
        api_id: item.team.id,
        league_id: dbLeagueUuid
      }));

      const { error: tError } = await supabase
        .from('official_teams')
        .upsert(formattedTeams, { onConflict: 'api_id' });
        
      if (tError) throw tError;
      
      console.log(`✅ Başarılı: ${leagueData.response[0].league.name} ve ${formattedTeams.length} takım senkronize edildi.`);
      return true;
    }

    return false;
  } catch (error: any) {
    console.error(`❌ Senkronizasyon Hatası (Lig ID: ${leagueApiId}):`, error.message);
    return false;
  }
};