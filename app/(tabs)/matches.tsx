import { useUserMatches } from '@/hooks/useUserMatches';
import { useLeagueStore } from '@/store/useLeagueStore';
import { Match } from '@/types/database';
import { styled } from 'nativewind';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouch = styled(TouchableOpacity);

export default function MatchesScreen() {
  const [activeTab, setActiveTab] = useState<'played' | 'pending'>('played');
  const userProfile = useLeagueStore((state) => state.userProfile);
  const { data: matches, isLoading } = useUserMatches();

  const filteredMatches = matches?.filter(m => {
    // is_completed true değilse 'pending' kabul et
    const isFinished = m.is_completed === true;
    return activeTab === 'played' ? isFinished : !isFinished;
  });

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

      {/* Tab Selector */}
      <StyledView className="flex-row bg-[#1a1d23] p-1.5 rounded-[22px] mb-6 border border-white/5 shadow-2xl">
        {(['played', 'pending'] as const).map((tab) => (
          <StyledTouch
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-3.5 rounded-[18px] items-center ${activeTab === tab ? 'bg-[#00ff85] shadow-lg shadow-[#00ff85]/20' : ''}`}
          >
            <StyledText className={`font-black uppercase text-[10px] tracking-[2px] ${activeTab === tab ? 'text-black' : 'text-gray-500'}`}>
              {tab === 'played' ? 'Oynananlar' : 'Fikstür'}
            </StyledText>
          </StyledTouch>
        ))}
      </StyledView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {isLoading ? (
          <ActivityIndicator color="#00ff85" className="mt-10" />
        ) : filteredMatches && filteredMatches.length > 0 ? (
          filteredMatches.map((match) => (
            <MatchItem key={match.id} match={match} currentUserId={userProfile?.id} />
          ))
        ) : (
          <StyledView className="items-center justify-center py-24 border border-dashed border-white/5 rounded-[40px] bg-[#1a1d23]/30">
            <StyledText className="text-gray-600 font-bold italic uppercase text-[10px] tracking-widest">
              Görüntülenecek maç bulunamadı
            </StyledText>
          </StyledView>
        )}
      </ScrollView>
    </StyledView>
  );
}

// kard bileşeni
const MatchItem = ({ match, currentUserId }: { match: Match, currentUserId?: string }) => {
  const isHome = match.home_user_id === currentUserId;
  const myScore = isHome ? match.home_score : match.away_score;
  const oppScore = isHome ? match.away_score : match.home_score;
  const isWinner = match.is_completed && (myScore || 0) > (oppScore || 0);

  return (
    <StyledView className={`bg-[#1a1d23] mb-4 p-6 rounded-[35px] border ${isWinner ? 'border-[#00ff85]/20' : 'border-white/5'}`}>
      <StyledView className="flex-row justify-between items-center">
        <StyledView className="items-center flex-1">
          <StyledText className="text-white/40 font-black text-[8px] uppercase mb-2 tracking-widest" numberOfLines={1}>
            {match.home_participant?.team_name}
          </StyledText>
          <StyledText className={`text-2xl font-black italic ${match.is_completed && match.home_score! > match.away_score! ? 'text-[#00ff85]' : 'text-white/80'}`}>
            {match.is_completed ? match.home_score : '?'}
          </StyledText>
        </StyledView>

        <StyledView className="px-6 items-center">
          <StyledView className="bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 mb-1">
            <StyledText className="text-white/20 font-black italic text-[9px]">VS</StyledText>
          </StyledView>
          {match.motm_user_id === currentUserId && (
            <StyledText className="text-[#f1c40f] text-[7px] font-black italic uppercase tracking-tighter">🌟 MVP</StyledText>
          )}
        </StyledView>

        <StyledView className="items-center flex-1">
          <StyledText className="text-white/40 font-black text-[8px] uppercase mb-2 tracking-widest" numberOfLines={1}>
            {match.away_participant?.team_name}
          </StyledText>
          <StyledText className={`text-2xl font-black italic ${match.is_completed && match.away_score! > match.home_score! ? 'text-[#00ff85]' : 'text-white/80'}`}>
            {match.is_completed ? match.away_score : '-'}
          </StyledText>
        </StyledView>
      </StyledView>
    </StyledView>
  );
};