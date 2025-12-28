import { useLeagueActions } from '@/hooks/useLeagueActions';
import { useFullFixture, useNextMatch, useUpdateMatchScore } from '@/hooks/useLeagueData';
import { useLeagueStore } from '@/store/useLeagueStore';
import { useUIStore } from '@/store/useUIStore';
import { League, Participant } from '@/types/database';
import { styled } from 'nativewind';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { FixtureList } from './FixtureList';
import LobbyView from './LobbyView';
import { ScoreEntryModal } from './ScoreEntryModal';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouch = styled(TouchableOpacity);

interface Props {
  // tipler merkezi sistemden geliyor
  league: League | null | undefined;
  standings: Participant[];
  onRefresh: () => void;
}

export const DashboardView = ({ league, standings, onRefresh }: Props) => {
  const { finishTournament, isSubmitting } = useLeagueActions();
  const [activeTab, setActiveTab] = useState<'standings' | 'fixture'>('standings');
  const userProfile = useLeagueStore((state) => state.userProfile);
  // data ve hooks
  const { data: nextMatch, isLoading: isMatchLoading } = useNextMatch(league?.id || null);
  const { data: fullFixture } = useFullFixture(league?.id || null);
  // modal management
  const scoreModalVisible = useUIStore((state) => state.scoreModalVisible);
  const { openScoreModal, closeScoreModal } = useUIStore((state) => state.actions);
  // mutasyon
  const updateMatch = useUpdateMatchScore();
  // admin kontrolü
  const isAdmin = league?.admin_id === userProfile?.id;
  const handleFinishPress = () => {
    if (!league?.id) return;

    Alert.alert(
      "Turnuvayı Resmen Kapat",
      "Bu işlemle tüm istatistikler oyuncuların profillerine (Kariyer Kartlarına) kalıcı olarak işlenecek. Lig durumu 'Arşivlendi' olarak güncellenecek. Hazır mısın?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Evet, Bitir ve İşle",
          style: "destructive",
          onPress: () => finishTournament(league.id)
        }
      ]
    );
  };

  // lobi kontrolü
  if (league?.status === 'lobby') {
    return (
      <LobbyView
        league={league}
        isAdmin={isAdmin}
        onRefresh={onRefresh}
      />
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#0b0e11]"
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor="#00ff85" />
      }
    >
      {/* BAŞLIK */}
      <StyledView className="mt-4 mb-8">
        <StyledText className="text-white text-4xl font-black italic tracking-tighter">
          LEAGUE<StyledText className="text-[#00ff85]">MASTER</StyledText>
        </StyledText>
      </StyledView>

      {/* 1. SIRADAKİ MAÇ KARTI */}
      <StyledText className="text-white/40 mb-3 font-black text-[10px] uppercase tracking-[3px] ml-1">
        Sıradaki Mücadele
      </StyledText>

      <StyledView className="bg-[#1a1d23] rounded-[35px] mb-8 overflow-hidden border border-white/5 shadow-2xl">
        <StyledView className="p-6">
          {isMatchLoading ? (
            <ActivityIndicator color="#00ff85" />
          ) : nextMatch ? (
            <>
              <StyledView className="flex-row justify-between items-center mb-6">
                <StyledView className="items-center flex-1">
                  <StyledView className="w-14 h-14 bg-[#0b0e11] rounded-2xl items-center justify-center border border-[#00ff85]/20 mb-2">
                    <StyledText className="text-[#00ff85] text-2xl font-black italic">
                      {nextMatch.home_participant?.team_name?.[0]?.toUpperCase() || '?'}
                    </StyledText>
                  </StyledView>
                  <StyledText className="text-white font-black text-[11px] uppercase italic text-center" numberOfLines={1}>
                    {nextMatch.home_participant?.team_name}
                  </StyledText>
                </StyledView>

                <StyledView className="px-4">
                  <StyledView className="bg-[#00ff85] px-3 py-1 rounded-md rotate-[-5deg]">
                    <StyledText className="text-black font-black italic text-xs">VS</StyledText>
                  </StyledView>
                </StyledView>

                <StyledView className="items-center flex-1">
                  <StyledView className="w-14 h-14 bg-[#0b0e11] rounded-2xl items-center justify-center border border-white/5 mb-2">
                    <StyledText className="text-white/60 text-2xl font-black italic">
                      {nextMatch.away_participant?.team_name?.[0]?.toUpperCase() || '?'}
                    </StyledText>
                  </StyledView>
                  <StyledText className="text-white font-black text-[11px] uppercase italic text-center" numberOfLines={1}>
                    {nextMatch.away_participant?.team_name}
                  </StyledText>
                </StyledView>
              </StyledView>

              <StyledView className="flex-row space-x-3 gap-x-2">
                <StyledTouch
                  onPress={() => openScoreModal(nextMatch)}
                  className="flex-1 bg-[#1a1d23] py-4 rounded-2xl items-center border border-[#00ff85]/20 active:opacity-60"
                >
                  <StyledText className="text-[#00ff85] font-black uppercase italic tracking-widest text-[10px]">
                    Skor Gir
                  </StyledText>
                </StyledTouch>

                <StyledTouch
                  onPress={() => openScoreModal(nextMatch)}
                  className="flex-1 bg-[#00ff85] py-4 rounded-2xl items-center shadow-lg shadow-[#00ff85]/30 active:opacity-80"
                >
                  <StyledText className="text-black font-black uppercase italic tracking-widest text-[10px]">
                    Maçı Bitir
                  </StyledText>
                </StyledTouch>
              </StyledView>
            </>
          ) : (
            /* lig bitimi şampiyon paneli */
            <StyledView className="items-center py-4">
              <StyledView className="w-20 h-20 bg-[#f1c40f]/10 rounded-[30px] items-center justify-center border border-[#f1c40f]/30 mb-4 shadow-2xl shadow-[#f1c40f]/20">
                <StyledText className="text-4xl">🏆</StyledText>
              </StyledView>

              <StyledView className="items-center">
                <StyledText className="text-[#f1c40f] font-black text-2xl italic uppercase tracking-tighter">
                  ŞAMPİYON
                </StyledText>
                <StyledText className="text-white font-black text-3xl uppercase italic text-center mt-1">
                  {standings[0]?.team_name}
                </StyledText>
              </StyledView>

              <StyledView className="flex-row mt-6 bg-black/40 rounded-3xl border border-white/5 overflow-hidden">
                <StyledView className="px-6 py-3 items-center border-r border-white/5">
                  <StyledText className="text-[#00ff85] font-black text-xl">{standings[0]?.points}</StyledText>
                  <StyledText className="text-white/30 text-[8px] font-black uppercase tracking-widest">PUAN</StyledText>
                </StyledView>
                <StyledView className="px-6 py-3 items-center">
                  <StyledText className="text-[#f1c40f] font-black text-xl">{standings[0]?.motm_count || 0}</StyledText>
                  <StyledText className="text-white/30 text-[8px] font-black uppercase tracking-widest">MOTM</StyledText>
                </StyledView>
              </StyledView>

              {isAdmin && league?.status === 'active' && (
                <StyledTouch
                  onPress={handleFinishPress}
                  disabled={isSubmitting}
                  className="mt-8 bg-[#00ff85] px-8 py-4 rounded-[25px] shadow-2xl shadow-[#00ff85]/40 active:opacity-80"
                >
                  <StyledText className="text-black font-black uppercase italic tracking-widest text-[11px]">
                    {isSubmitting ? "VERİLER İŞLENİYOR..." : "🏆 TURNUVAYI RESMEN BİTİR"}
                  </StyledText>
                </StyledTouch>
              )}

              <StyledView className="mt-6 flex-row items-center bg-[#00ff85]/5 px-4 py-2 rounded-full border border-[#00ff85]/10">
                <StyledView className="w-1.5 h-1.5 rounded-full bg-[#00ff85] mr-2 animate-pulse" />
                <StyledText className="text-[#00ff85]/60 font-black text-[9px] uppercase tracking-[2px]">
                  LİG SEZONU TAMAMLANDI
                </StyledText>
              </StyledView>
            </StyledView>
          )}
        </StyledView>
      </StyledView>

      {/* Puan Durumu / Fikstür */}
      <StyledView className="flex-row bg-[#1a1d23] p-1.5 rounded-2xl mb-6">
        <StyledTouch
          onPress={() => setActiveTab('standings')}
          className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'standings' ? 'bg-[#00ff85]' : ''}`}
        >
          <StyledText className={`font-black text-[10px] uppercase italic ${activeTab === 'standings' ? 'text-black' : 'text-gray-500'}`}>Puan Durumu</StyledText>
        </StyledTouch>
        <StyledTouch
          onPress={() => setActiveTab('fixture')}
          className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'fixture' ? 'bg-[#00ff85]' : ''}`}
        >
          <StyledText className={`font-black text-[10px] uppercase italic ${activeTab === 'fixture' ? 'text-black' : 'text-gray-500'}`}>Fikstür</StyledText>
        </StyledTouch>
      </StyledView>

      {/* 3. DİNAMİK İÇERİK */}
      {activeTab === 'standings' ? (
        <StyledView>
          <StyledView className="flex-row justify-between items-end mb-4 px-1">
            <StyledText className="text-white font-black text-lg italic uppercase tracking-widest">Sıralama</StyledText>
            <StyledText className="text-gray-500 font-bold text-[10px]">O / AV / P</StyledText>
          </StyledView>

          <StyledView className="bg-[#1a1d23] rounded-[30px] overflow-hidden border border-gray-900 shadow-xl">
            {standings.map((item, index) => (
              <StyledView key={item.id} className={`flex-row items-center p-5 border-b border-gray-900/50 ${index === 0 ? 'bg-[#00ff85]/5' : ''}`}>
                <StyledText className={`font-black w-6 text-sm ${index === 0 ? 'text-[#00ff85]' : 'text-gray-700'}`}>{index + 1}</StyledText>

                <StyledView className="flex-1 ml-2">
                  <StyledView className="flex-row items-center">
                    {/* 1. Takım İsmi - Ana Odak */}
                    <StyledText className="text-white font-black text-[13px] uppercase tracking-tighter">
                      {item.team_name}
                    </StyledText>

                    {/* MOTM Yıldız İkonu */}
                    {(item.motm_count || 0) > 0 && (
                      <StyledView className="ml-2 bg-[#f1c40f]/20 px-1.5 py-0.5 rounded-md border border-[#f1c40f]/30">
                        <StyledText className="text-[#f1c40f] text-[9px] font-black">⭐ {item.motm_count}</StyledText>
                      </StyledView>
                    )}
                  </StyledView>

                  {/* 2. Kullanıcı Adı - İkincil Bilgi */}
                  <StyledText className="text-[#00ff85] text-[9px] font-bold uppercase tracking-widest mt-0.5 opacity-80">
                    @{item.profiles?.username}
                  </StyledText>
                </StyledView>

                <StyledView className="flex-row items-center">
                  <StyledText className="text-gray-500 font-bold text-[10px] w-6 text-center">{item.played}</StyledText>
                  <StyledText className="text-gray-400 font-bold text-[10px] w-8 text-center">{(item.goals_for || 0) - (item.goals_against || 0)}</StyledText>
                  <StyledView className="bg-[#00ff85]/10 px-3 py-1.5 rounded-xl ml-2">
                    <StyledText className="text-[#00ff85] font-black text-xs">{item.points} P</StyledText>
                  </StyledView>
                </StyledView>
              </StyledView>
            ))}
          </StyledView>
        </StyledView>
      ) : (
        // isAdmin prop u fikstür listesine geçiyor
        <FixtureList fixture={fullFixture || []} isAdmin={isAdmin} />
      )}

      {/* SCORE MODAL */}
      <ScoreEntryModal
        visible={scoreModalVisible}
        onClose={closeScoreModal}
        nextMatch={nextMatch}
        onSave={(h, a, motmId) => {
          if (nextMatch) {
            updateMatch.mutate({
              matchId: nextMatch.id,
              homeScore: h,
              awayScore: a,
              motmId: motmId // Mutate içine gönderiyoruz
            });
            closeScoreModal();
          }
        }}
      />
    </ScrollView>
  );
};