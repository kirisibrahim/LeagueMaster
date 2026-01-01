import { supabase } from '@/api/supabase';

const API_KEY = 'aec674c90705d3c189f1517458575485';
const BASE_URL = 'https://v3.football.api-sports.io';

export const syncCompleteLeague = async (leagueApiId: number) => {
  try {
    // LİG BİLGİSİNİ ÇEK VE official_leagues TABLOSUNA KAYDET
    const leagueRes = await fetch(`${BASE_URL}/leagues?id=${leagueApiId}`, {
      headers: { 'x-apisports-key': API_KEY }
    });
    const leagueData = await leagueRes.json();
    
    let dbLeagueUuid = null;
    
    if (leagueData.response?.[0]) {
      // Lig verisini upsert ediyoruz
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
      dbLeagueUuid = savedLeague.id; // Veritabanının oluşturduğu UUID'yi aldık
    }

    // TAKIMLARI ÇEK VE ALDIĞIMIZ LİG UUID'Sİ İLE KAYDET
    const teamRes = await fetch(`${BASE_URL}/teams?league=${leagueApiId}&season=2023`, {
      headers: { 'x-apisports-key': API_KEY }
    });
    const teamData = await teamRes.json();

    if (teamData.response && dbLeagueUuid) {
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
      console.log(`✅ ${leagueData.response[0].league.name} ve ${formattedTeams.length} takım senkronize edildi.`);
      return true;
    }
  } catch (error: any) {
    console.error(`❌ Lig ${leagueApiId} hatası:`, error.message);
    return false;
  }
};