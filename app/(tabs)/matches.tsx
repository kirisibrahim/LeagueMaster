import { useUserMatches } from '@/hooks/useUserMatches';
import { useLeagueStore } from '@/store/useLeagueStore';
import { Match } from '@/types/database';
import { styled } from 'nativewind';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouch = styled(TouchableOpacity);

export default function MatchesScreen() {
  const [activeTab, setActiveTab] = useState<'played' | 'pending'>('played');
  const userProfile = useLeagueStore((state) => state.userProfile);
  const currentLeagueId = useLeagueStore((state) => state.currentLeagueId);

  // Storeun veritabanı ile senkronizasyon durumunu takip ediyoruz.
  const isStoreSyncing = useLeagueStore((state) => state.isLoading);

  const { data: matches, isLoading: isQueryLoading } = useUserMatches();

  // Filtreleme mantığını en güvenli hale getirdik.
  const filteredMatches = useMemo(() => {
    // Store henüz yükleniyorsa veya ID yoksa veya veri gelmemişse boş dön.
    if (isStoreSyncing || !currentLeagueId || !matches) return [];

    return matches.filter(m => {
      // sadece o anki aktif ligin maçlarını göster
      const isThisLeague = String(m.league_id) === String(currentLeagueId);
      const isFinished = Boolean(m.is_completed);
      const isTabMatch = activeTab === 'played' ? isFinished : !isFinished;

      return isThisLeague && isTabMatch;
    });
  }, [matches, activeTab, currentLeagueId, isStoreSyncing]);

  // Store veritabanından güncel lig durumunu alana kadar bekle.
  // saniyelik "hayalet maç" görüntüsünü engeller.
  if (isStoreSyncing) {
    return (
      <StyledView className="flex-1 bg-[#0b0e11] justify-center items-center">
        <ActivityIndicator color="#00ff85" size="large" />
      </StyledView>
    );
  }

  //  Aktif lig gerçekten yoksa boş ekranı göster.
  if (!currentLeagueId) {
    return (
      <StyledView className="flex-1 bg-[#0b0e11] p-4 justify-center items-center">
        <StyledView className="w-24 h-24 bg-[#1a1d23] rounded-full items-center justify-center mb-6 border border-white/5 shadow-2xl">
          <StyledText className="text-4xl opacity-40">🏟️</StyledText>
        </StyledView>
        <StyledText className="text-white text-2xl font-black italic uppercase tracking-tighter text-center">
          MAÇ MERKEZİ <StyledText className="text-[#00ff85]">BOŞ</StyledText>
        </StyledText>
        <StyledText className="text-gray-500 text-center mt-3 text-[10px] font-bold uppercase tracking-[2px] leading-5 px-10">
          Şu an aktif bir turnuvada değilsin. Yeni bir rekabet başladığında maçların burada listelenecek.
        </StyledText>
      </StyledView>
    );
  }
  
  return (
    <StyledView className="flex-1 bg-[#0b0e11] p-4">
      {/* Header */}
      <StyledView className="mt-12 mb-6 px-2">
        <StyledText className="text-white text-3xl font-black italic tracking-tighter uppercase">
          MAÇ <StyledText className="text-[#00ff85]">MERKEZİ</StyledText>
        </StyledText>
        <StyledText className="text-gray-500 text-[10px] font-bold uppercase tracking-[2px] mt-1">
          {userProfile?.username} İstatistikleri
        </StyledText>
      </StyledView>

      {/* tab selector */}
      <StyledView className="flex-row bg-[#1a1d23] p-1.5 rounded-[22px] mb-6 border border-white/5 shadow-2xl">
        {(['played', 'pending'] as const).map((tab) => (
          <StyledTouch
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-3.5 rounded-[18px] items-center ${activeTab === tab ? 'bg-[#00ff85] shadow-lg shadow-[#00ff85]/20' : ''
              }`}
          >
            <StyledText
              className={`font-black uppercase text-[10px] tracking-[2px] ${activeTab === tab ? 'text-black' : 'text-gray-500'
                }`}
            >
              {tab === 'played' ? 'Oynananlar' : 'Fikstür'}
            </StyledText>
          </StyledTouch>
        ))}
      </StyledView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {isQueryLoading ? (
          <ActivityIndicator color="#00ff85" className="mt-10" />
        ) : filteredMatches.length > 0 ? (
          filteredMatches.map((match) => (
            <MatchItem key={match.id} match={match} currentUserId={userProfile?.id} />
          ))
        ) : (
          <StyledView className="items-center justify-center py-24 border border-dashed border-white/5 rounded-[40px] bg-[#1a1d23]/30">
            <StyledText className="text-gray-600 font-bold italic uppercase text-[10px] tracking-widest">
              Görüntülenecek {activeTab === 'played' ? 'maç' : 'fikstür'} bulunamadı
            </StyledText>
          </StyledView>
        )}
      </ScrollView>
    </StyledView>
  );
}

const MatchItem = ({ match, currentUserId }: { match: Match; currentUserId?: string }) => {
  // kazananı belirlemek için kontrol
  const isHomeWinner = match.is_completed && (match.home_score ?? 0) > (match.away_score ?? 0);
  const isAwayWinner = match.is_completed && (match.away_score ?? 0) > (match.home_score ?? 0);

  return (
    <StyledView className="bg-[#1a1d23] mb-4 p-6 rounded-[35px] border border-white/5">
      <StyledView className="flex-row justify-between items-center">

        {/* evsahibi hep solda */}
        <StyledView className="items-center flex-1">
          {/* Sensen yeşil değilsen beyaz */}
          <StyledText
            className={`font-black text-[12px] uppercase tracking-tighter ${match.home_user_id === currentUserId ? 'text-[#00ff85]' : 'text-white'
              }`}
            numberOfLines={1}
          >
            {match.home_participant?.profiles?.username || 'Bilinmiyor'}
          </StyledText>

          <StyledText className="text-gray-500 font-bold text-[8px] uppercase mt-0.5">
            {match.home_participant?.team_name}
          </StyledText>

          {/* galibiyet yeşil mağlubiyett gri */}
          <StyledText
            className={`text-3xl font-black italic mt-3 ${isHomeWinner ? 'text-[#00ff85]' : 'text-white/80'
              }`}
          >
            {match.is_completed ? match.home_score : '?'}
          </StyledText>
        </StyledView>


        {/* vs alanı */}
        <StyledView className="px-4 items-center">
          <StyledView className="bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 mb-1">
            <StyledText className="text-white/20 font-black italic text-[9px]">VS</StyledText>
          </StyledView>
          {/* MVP Yıldızı */}
          {match.motm_user_id && (
            <StyledText className="text-[#f1c40f] text-[7px] font-black italic mt-1">🌟 MVP</StyledText>
          )}
        </StyledView>


        {/* deplasman hep sağda */}
        <StyledView className="items-center flex-1">
          <StyledText
            className={`font-black text-[12px] uppercase tracking-tighter ${match.away_user_id === currentUserId ? 'text-[#00ff85]' : 'text-white'
              }`}
            numberOfLines={1}
          >
            {match.away_participant?.profiles?.username || 'Bilinmiyor'}
          </StyledText>

          <StyledText className="text-gray-500 font-bold text-[8px] uppercase mt-0.5">
            {match.away_participant?.team_name}
          </StyledText>

          <StyledText
            className={`text-3xl font-black italic mt-3 ${isAwayWinner ? 'text-[#00ff85]' : 'text-white/80'
              }`}
          >
            {match.is_completed ? match.away_score : '?'}
          </StyledText>
        </StyledView>

      </StyledView>
    </StyledView>
  );
};