import { supabase } from './supabase';

export const startLeagueAndGenerateFixtures = async (leagueId: string) => {
  try {
    // lig bilgilerini ve katılımcıları çek
    const { data: league, error: lError } = await supabase
      .from('leagues')
      .select('*, league_participants(user_id)')
      .eq('id', leagueId)
      .single();

    if (lError || !league) throw new Error("Lig bilgileri alınamadı.");
    const participants = league.league_participants;
    
    if (participants.length < 2) throw new Error("En az 2 oyuncu gerekli.");

    // fikstür algoritması
    let matches = [];
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        // İlk maç (1. Devre)
        matches.push({
          league_id: leagueId,
          home_user_id: participants[i].user_id,
          away_user_id: participants[j].user_id,
          status: 'pending',
          is_completed: false,
          round_number: 1
        });

        // Eğer format 'double' (rövanşlı) ise
        if (league.format === 'double') {
          matches.push({
            league_id: leagueId,
            home_user_id: participants[j].user_id,
            away_user_id: participants[i].user_id,
            status: 'pending',
            is_completed: false,
            round_number: 2
          });
        }
      }
    }

    // maçları karıştır ve sıra ata
    matches = matches.sort(() => Math.random() - 0.5);
    const finalMatches = matches.map((m, index) => ({
      ...m,
      match_order: index + 1
    }));

    // maçları database e yaz
    const { error: matchError } = await supabase.from('matches').insert(finalMatches);
    if (matchError) throw matchError;

    // lig aktif et ve match_order ı 1 e sabitle
    const { error: leagueUpdateError } = await supabase
      .from('leagues')
      .update({ 
        status: 'active',
        current_match_order: 1 
      })
      .eq('id', leagueId);

    if (leagueUpdateError) throw leagueUpdateError;

    return { success: true };
  } catch (error: any) {
    console.error("Motor Hatası:", error.message);
    return { success: false, error: error.message };
  }
};