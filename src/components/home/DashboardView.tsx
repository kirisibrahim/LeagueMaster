import { supabase } from '@/api/supabase';
import { useLeagueActions } from '@/hooks/useLeagueActions';
import { useFullFixture, useNextMatch, useStartMatch, useUpdateLiveScore, useUpdateMatchScore } from '@/hooks/useLeagueData';
import { useLeagueStore } from '@/store/useLeagueStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useUIStore } from '@/store/useUIStore';
import { League, Match, Participant } from '@/types/database';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { styled } from 'nativewind';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ScreenWrapper from '../common/ScreenWrapper';
import { FixtureList } from './FixtureList';
import LobbyView from './LobbyView';
import { ScoreEntryModal } from './ScoreEntryModal';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouch = styled(TouchableOpacity);

// participant tipine logo alanını ekliyoruz
interface DashboardParticipant extends Participant {
  official_teams?: {
    logo_url: string;
  } | null;
}

// match tipindeki katılımcıları loglu tiple ezme
interface DashboardMatch extends Omit<Match, 'home_participant' | 'away_participant'> {
  home_participant?: DashboardParticipant;
  away_participant?: DashboardParticipant;
}

interface Props {
  league: League | null | undefined;
  standings: DashboardParticipant[];
  onRefresh: () => void;
}

export const DashboardView = ({ league, standings, onRefresh }: Props) => {
  const { showNotification, showConfirm } = useNotificationStore();
  const queryClient = useQueryClient();
  const { finishTournament, deleteLeague, isSubmitting } = useLeagueActions();
  const [activeTab, setActiveTab] = useState<'standings' | 'fixture'>('standings');
  const userProfile = useLeagueStore((state) => state.userProfile);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { setCurrentLeagueId } = useLeagueStore();

  // data ve hooks
  const { data: nextMatch, isLoading: isMatchLoading } = useNextMatch(league?.id || null) as {
    data: DashboardMatch | null,
    isLoading: boolean
  };
  const { data: fullFixture } = useFullFixture(league?.id || null);

  // modal yönetimi
  const scoreModalVisible = useUIStore((state) => state.scoreModalVisible);
  const { openScoreModal, closeScoreModal } = useUIStore((state) => state.actions);

  // mutasyonlar
  const startMatch = useStartMatch();
  const updateLiveScore = useUpdateLiveScore();
  const updateMatch = useUpdateMatchScore();

  // admin kontrol
  const isAdmin = league?.admin_id === userProfile?.id;

  // realtime
  useEffect(() => {
    if (!league?.id) return;

    const channelId = `dashboard_realtime_${league.id}`;

    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `league_id=eq.${league.id}`,
        },
        () => {
          console.log("⚽ Maç verileri güncellendi...");
          queryClient.invalidateQueries({ queryKey: ['standings', league.id] });
          queryClient.invalidateQueries({ queryKey: ['nextMatch', league.id] });
          queryClient.invalidateQueries({ queryKey: ['fullFixture', league.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leagues',
          filter: `id=eq.${league.id}`
        },
        (payload: any) => {
          if (payload.new?.status === 'completed') {
            console.log("🚀 Lig bitti! Hedefli temizlik yapılıyor...");
            queryClient.invalidateQueries({ queryKey: ['league_details', league.id] });
            queryClient.invalidateQueries({ queryKey: ['standings', league.id] });
            setCurrentLeagueId(null); // lobiye dönmek için
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [league?.id]);

  useEffect(() => {
    if (league?.status === 'completed') {
      console.log("⚠️ Mevcut lig zaten bitmiş, lobiye yönlendiriliyorsun...");
      // temizlik
      queryClient.clear();
      setCurrentLeagueId(null);
      showNotification("Bu turnuva tamamlanmış.", "info");
    }
  }, [league?.status]); // ilk yükleme de ve status değiştiğinde kontrol

  // şampiyon animasyonu
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // lobi kontrol
  if (league?.status === 'lobby') {
    return (
      <LobbyView
        league={league}
        isAdmin={isAdmin}
        onRefresh={onRefresh}
      />
    );
  }

  const handleFinishPress = () => {
    if (!league?.id) return;

    showConfirm(
      "🏆 TURNUVAYI RESMEN KAPAT",
      "Bu işlemle tüm istatistikler oyuncuların profillerine kalıcı olarak işlenecek. Hazır mısın?",
      [
        {
          text: "VAZGEÇ",
          style: "cancel",
          onPress: () => { }
        },
        {
          text: "EVET, BİTİR VE İŞLE",
          style: "destructive",
          onPress: async () => {
            try {
              await finishTournament(league.id);
              showNotification("Turnuva başarıyla tamamlandı!", "info");
            } catch (error) {
              showNotification("Bir hata oluştu.", "error");
            }
          }
        }
      ]
    );
  };

  const myParticipant = userProfile?.id
    ? standings?.find(p => p.user_id === userProfile.id)
    : null;

  const handleScoreSave = async (homeScore: number, awayScore: number, motmId: string | null) => {
    if (!nextMatch) return;

    if (motmId !== null) {
      updateMatch.mutate({
        matchId: nextMatch.id,
        homeScore,
        awayScore,
        motmId,
        status: 'completed',
      });
    } else {
      updateLiveScore.mutate({
        matchId: nextMatch.id,
        homeScore,
        awayScore,
      });
    }
  };

  const handleCancelLeague = () => {
    if (!league?.id) return;
    showConfirm(
      '🚨 LİGİ İPTAL ET',
      'DİKKAT: Bu Lig şu an oynanıyor! İptal edersen tüm sonuçlar ve istatistikler kalıcı olarak silinecek. Emin misin?',
      [
        {
          text: 'VAZGEÇ',
          style: 'cancel',
          onPress: () => { }
        },
        {
          text: 'EVET, HER ŞEYİ SİL',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLeague(league.id);
              showNotification('Turnuva başarıyla silindi.', 'info');
            } catch (error) {
              showNotification('Silme işlemi başarısız oldu.', 'error');
            }
          }
        }
      ]
    );
  };

  return (
    <ScreenWrapper withBottomInset={false}>
      <StyledView className="flex-1 bg-[#0b0e11] px-2">
        <StyledView className="flex-row items-center justify-between mb-2">
          <StyledView className="flex-row items-center flex-1 mr-2">
            <StyledView className="w-16 h-16 items-center justify-center">
              <Image
                source={require('../../../assets/images/logo_main.png')}
                className="w-16 h-16"
                resizeMode="contain"
              />
            </StyledView>
            <StyledView className="ml-3 flex-1">
              <StyledView className="flex-row items-center mb-0.5">
                <StyledView className="w-1.5 h-1.5 rounded-full bg-[#00ff85] animate-pulse mr-2" />
                <StyledText
                  className="text-[#00ff85] text-[9px] font-black uppercase tracking-[1px]"
                  numberOfLines={1}
                >
                  {league?.name || 'LİG'} LİGİ
                </StyledText>
              </StyledView>

              <StyledText
                className="text-white text-xl font-black italic tracking-tighter uppercase leading-tight"
                numberOfLines={1}
              >
                {userProfile?.username || 'OYUNCU'}
              </StyledText>
            </StyledView>
          </StyledView>
          {myParticipant && (
            <StyledView className="flex-row items-center bg-[#1a1d23] pl-3 pr-1 py-1 rounded-2xl border border-white/10">
              <StyledView className="mr-2">
                <StyledText className="text-white/20 text-[7px] font-black uppercase text-right leading-none mb-1">
                  Yönetilen
                </StyledText>
                <StyledText
                  className="text-white text-[10px] font-black uppercase tracking-tighter text-right leading-none"
                  numberOfLines={1}
                >
                  {myParticipant.team_name}
                </StyledText>
              </StyledView>

              <StyledView className="w-9 h-9 items-center justify-center">
                {myParticipant.official_teams?.logo_url ? (
                  <Image
                    source={{ uri: myParticipant.official_teams.logo_url }}
                    className="w-9 h-9"
                    resizeMode="contain"
                  />
                ) : (
                  <StyledText className="text-[#00ff85] text-xs font-black">
                    {myParticipant.team_name?.[0]}
                  </StyledText>
                )}
              </StyledView>
            </StyledView>
          )}
        </StyledView>

        <StyledView className="bg-[#1a1d23] rounded-3xl mb-4 overflow-hidden border border-white/5 shadow-2xl">
          {nextMatch && !isMatchLoading && (
            <StyledView className="absolute top-0 left-0 right-0 items-center z-20">
              <StyledView
                className={`${nextMatch.status === 'live' ? 'bg-red-600' : 'bg-[#00ff85]'} px-6 py-1.5 flex-row items-center shadow-lg`}
                style={{
                  borderBottomLeftRadius: 12,
                  borderBottomRightRadius: 12,
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                }}
              >
                <StyledView className={`w-1.5 h-1.5 rounded-full ${nextMatch.status === 'live' ? 'bg-white' : 'bg-black'} mr-2 animate-pulse`} />
                <StyledText className={`${nextMatch.status === 'live' ? 'text-white' : 'text-black'} font-black text-[9px] uppercase tracking-[2px]`}>
                  {nextMatch.status === 'live' ? 'AKTİF MÜCADELE' : 'SIRADAKİ MÜCADELE'}
                </StyledText>
              </StyledView>
            </StyledView>
          )}

          <StyledView className="p-4 pt-10">
            {isMatchLoading ? (
              <ActivityIndicator color="#00ff85" />
            ) : nextMatch ? (
              <>
                <StyledView className="flex-row justify-between items-center mb-6">
                  <StyledView className="items-center flex-1 px-1">
                    <StyledView className="relative">
                      <StyledView className="w-14 h-14 bg-[#0b0e11] rounded-2xl items-center justify-center border border-[#00ff85]/20 mb-2">
                        {nextMatch.home_participant?.official_teams?.logo_url ? (
                          <Image
                            source={{ uri: nextMatch.home_participant.official_teams.logo_url }}
                            className="w-10 h-10"
                            resizeMode="contain"
                          />
                        ) : (
                          <StyledText className="text-[#00ff85] text-2xl font-black italic">
                            {nextMatch.home_participant?.team_name?.[0]?.toUpperCase() || '?'}
                          </StyledText>
                        )}
                      </StyledView>
                      {(nextMatch.status === 'live' || nextMatch.status === 'completed') && (
                        <StyledView className="absolute -bottom-1 bg-[#00ff85] px-2 py-0.5 rounded-lg border-2 border-[#1a1d23] self-center">
                          <StyledText className="text-black font-black text-[10px]">{nextMatch.home_score ?? 0}</StyledText>
                        </StyledView>
                      )}
                    </StyledView>

                    <StyledText className="text-white font-black text-[12px] uppercase italic text-center mt-1" numberOfLines={1}>
                      {nextMatch.home_participant?.team_name}
                    </StyledText>
                    <StyledText className="text-white/40 font-bold text-[9px] uppercase text-center mt-0.5" numberOfLines={1}>
                      @{nextMatch.home_participant?.profiles?.username || 'unknown'}
                    </StyledText>
                  </StyledView>

                  <StyledView className="px-2 h-14 justify-center items-center">
                    <StyledView className="absolute w-[1px] h-10 bg-white/10" />
                    <StyledView className={`bg-[#1a1d23] border ${nextMatch.status === 'live' ? 'border-red-500' : 'border-[#00ff85]/40'} px-2 py-1.5 rounded-full z-10`}>
                      <StyledView className={`${nextMatch.status === 'live' ? 'bg-red-600' : 'bg-[#00ff85]'} w-1.5 h-1.5 rounded-full animate-pulse absolute -top-0.5 -right-0.5 shadow-sm shadow-[#00ff85]`} />
                      <StyledText className={`${nextMatch.status === 'live' ? 'text-red-500' : 'text-[#00ff85]'} font-black italic text-[8px] tracking-tighter`}>
                        {nextMatch.status === 'live' ? 'LIVE' : `MAÇ - ${nextMatch.match_order}`}
                      </StyledText>
                    </StyledView>

                    <StyledView
                      style={{
                        width: 0, height: 0, backgroundColor: "transparent", borderStyle: "solid",
                        borderLeftWidth: 4, borderRightWidth: 4, borderBottomWidth: 6,
                        borderLeftColor: "transparent", borderRightColor: "transparent",
                        borderBottomColor: nextMatch.status === 'live' ? "#dc2626" : "#00ff85",
                        transform: [{ rotate: '180deg' }], marginTop: 4
                      }}
                    />
                  </StyledView>

                  <StyledView className="items-center flex-1 px-1">
                    <StyledView className="relative">
                      <StyledView className="w-14 h-14 bg-[#0b0e11] rounded-2xl items-center justify-center border border-white/5 mb-2">
                        {nextMatch.away_participant?.official_teams?.logo_url ? (
                          <Image
                            source={{ uri: nextMatch.away_participant.official_teams.logo_url }}
                            className="w-10 h-10"
                            resizeMode="contain"
                          />
                        ) : (
                          <StyledText className="text-white/60 text-2xl font-black italic">
                            {nextMatch.away_participant?.team_name?.[0]?.toUpperCase() || '?'}
                          </StyledText>
                        )}
                      </StyledView>

                      {(nextMatch.status === 'live' || nextMatch.status === 'completed') && (
                        <StyledView className="absolute -bottom-1 bg-white px-2 py-0.5 rounded-lg border-2 border-[#1a1d23] self-center">
                          <StyledText className="text-black font-black text-[10px]">{nextMatch.away_score ?? 0}</StyledText>
                        </StyledView>
                      )}
                    </StyledView>

                    <StyledText className="text-white font-black text-[12px] uppercase italic text-center mt-1" numberOfLines={1}>
                      {nextMatch.away_participant?.team_name}
                    </StyledText>
                    <StyledText className="text-white/40 font-bold text-[9px] uppercase text-center mt-0.5" numberOfLines={1}>
                      @{nextMatch.away_participant?.profiles?.username || 'unknown'}
                    </StyledText>
                  </StyledView>
                </StyledView>

                {isAdmin ? (
                  <StyledView>
                    {/* pending durumu */}
                    {nextMatch.status === 'pending' && (
                      <StyledTouch
                        onPress={() => startMatch.mutate(nextMatch.id)}
                        disabled={startMatch.isPending}
                        className="w-full bg-[#00ff85] py-2 rounded-xl items-center justify-center shadow-2xl shadow-[#00ff85]/40 active:scale-[0.98]"
                        style={{ elevation: 8 }}
                      >
                        <StyledView className="flex-row items-center justify-center">
                          {startMatch.isPending ? (
                            <>
                              <ActivityIndicator color="black" size="small" className="mr-2" />
                              <StyledText className="text-black font-black uppercase tracking-[2px] text-[14px]">
                                HAZIRLANIYOR...
                              </StyledText>
                            </>
                          ) : (
                            <>
                              <Ionicons name="play-sharp" size={18} color="black" style={{ marginRight: 10 }} />
                              <StyledText className="text-black font-bold uppercase tracking-[3px] text-[15px]">
                                SANTRA
                              </StyledText>
                            </>
                          )}
                        </StyledView>
                      </StyledTouch>
                    )}

                    {/* live durumu */}
                    {nextMatch.status === 'live' && (
                      <StyledView className="flex-row space-x-3 gap-x-3">
                        <StyledTouch
                          onPress={() => openScoreModal(nextMatch, 'live')}
                          className="flex-1 bg-[#1a1d23] py-2 rounded-xl items-center flex-row justify-center border border-[#00ff85]/30 shadow-xl active:scale-[0.96]"
                        >
                          <Ionicons name="football-outline" size={16} color="#00ff85" />
                          <StyledText className="text-[#00ff85] font-black uppercase tracking-[2px] text-[12px] ml-2">
                            CANLI SKOR
                          </StyledText>
                        </StyledTouch>
                        <StyledTouch
                          onPress={() => openScoreModal(nextMatch, 'finish')}
                          className="flex-1 bg-[#ff4b4b] py-2 rounded-xl items-center flex-row justify-center shadow-lg shadow-red-500/40 active:scale-[0.96]"
                        >
                          <MaterialCommunityIcons name="whistle" size={20} color="white" />
                          <StyledText className="text-white font-black uppercase tracking-[2px] text-[12px] ml-2">
                            SON DÜDÜK
                          </StyledText>
                        </StyledTouch>
                      </StyledView>
                    )}
                  </StyledView>
                ) : (
                  // admin olmayanlar için 
                  <StyledView className="bg-black/20 py-3 px-4 rounded-xl border border-white/5 items-center">
                    <StyledText className="text-white/30 font-bold text-[9px] uppercase tracking-[2px] text-center">
                      Maç yönetimi sadece lig yöneticisi tarafından yapılabilir
                    </StyledText>
                  </StyledView>
                )}
              </>
            ) : (
              // şampiyon paneli
              <StyledView className="items-center py-8">
                <StyledView className="relative mb-10 items-center justify-center">
                  <Animated.View
                    style={{
                      position: 'absolute',
                      width: 160,
                      height: 160,
                      backgroundColor: '#f1c40f',
                      borderRadius: 80,
                      opacity: pulseAnim.interpolate({
                        inputRange: [1, 1.2],
                        outputRange: [0.05, 0.15], // Opaklık 0.05 ile 0.15 arası gidip gelir
                      }),
                      transform: [{ scale: pulseAnim }],
                    }}
                  />

                  <StyledView
                    className="w-32 h-32 bg-[#1a1d23] rounded-[36px] items-center justify-center border-2 border-[#f1c40f] z-10"
                    style={{
                      shadowColor: "#f1c40f",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.5,
                      shadowRadius: 25,
                      elevation: 20,
                    }}
                  >
                    {standings[0]?.official_teams?.logo_url ? (
                      <Image
                        source={{ uri: standings[0].official_teams.logo_url }}
                        className="w-24 h-24"
                        resizeMode="contain"
                      />
                    ) : (
                      <StyledText className="text-[#f1c40f] text-4xl font-black italic">
                        {standings[0]?.team_name?.[0]?.toUpperCase()}
                      </StyledText>
                    )}
                  </StyledView>

                  <StyledView
                    className="absolute -bottom-2 -right-2 bg-[#f1c40f] w-12 h-12 rounded-full items-center justify-center border-4 border-[#1a1d23] z-20 shadow-xl"
                    style={{ transform: [{ rotate: '12deg' }] }}
                  >
                    <StyledText className="text-xl">🏆</StyledText>
                  </StyledView>
                </StyledView>

                <StyledView className="items-center mb-6">
                  <StyledView className="bg-white/5 px-3 py-1 rounded-lg border border-white/10 mb-2">
                    <StyledText className="text-[#00ff85] font-bold text-[10px] uppercase tracking-[2px]">
                      @{standings[0]?.profiles?.username || 'user'}
                    </StyledText>
                  </StyledView>

                  <StyledText className="text-[#f1c40f] font-black text-[12px] uppercase tracking-[6px] mb-1">
                    ŞAMPİYON
                  </StyledText>

                  <StyledText className="text-white font-black text-4xl uppercase tracking-tighter text-center">
                    {standings[0]?.team_name}
                  </StyledText>
                </StyledView>

                <StyledView className="flex-row items-center justify-center bg-black/30 rounded-2xl border border-white/5 px-2 py-3 mb-8">
                  <StyledView className="px-6 items-center border-r border-white/10">
                    <StyledText className="text-white font-black text-xl">{standings[0]?.points}</StyledText>
                    <StyledText className="text-white/20 text-[8px] font-black uppercase tracking-widest">PUAN</StyledText>
                  </StyledView>
                  <StyledView className="px-6 items-center">
                    <StyledText className="text-white font-black text-xl">{standings[0]?.motm_count || 0}</StyledText>
                    <StyledText className="text-white/20 text-[8px] font-black uppercase tracking-widest">MOTM</StyledText>
                  </StyledView>
                </StyledView>

                {isAdmin && league?.status === 'active' && (
                  <StyledTouch
                    onPress={handleFinishPress}
                    disabled={isSubmitting}
                    className="w-full bg-[#f1c40f] py-4 rounded-2xl items-center shadow-lg shadow-[#f1c40f]/20 active:opacity-90"
                  >
                    <StyledView className="flex-row items-center">
                      {isSubmitting ? (
                        <ActivityIndicator color="black" size="small" />
                      ) : (
                        <StyledText className="text-black font-black uppercase tracking-[2px] text-xs">
                          SEZONU RESMEN TAMAMLA
                        </StyledText>
                      )}
                    </StyledView>
                  </StyledTouch>
                )}

                <StyledView className="mt-6 flex-row items-center">
                  <StyledView className="w-1.5 h-1.5 rounded-full bg-[#00ff85] mr-2 animate-pulse" />
                  <StyledText className="text-white/30 font-black text-[9px] uppercase tracking-[2px]">
                    LİG TARİHİNE KAYDEDİLDİ
                  </StyledText>
                </StyledView>
              </StyledView>
            )}
          </StyledView>
        </StyledView>

        {/* paun durumu - fikstür */}
        <StyledView className="flex-row bg-[#1a1d23] p-1.5 rounded-2xl mb-2">
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

        {/*  dinamik içerik */}
        {activeTab === 'standings' ? (
          <StyledView className="flex-1">
            <StyledView className="flex-row justify-between items-center mb-6 px-2">
              <StyledView className="flex-row items-center mb-1">
                <StyledView className="w-1.5 h-6 bg-[#00ff85] rounded-full mr-3" />
                <StyledText className="text-white font-[1000] text-2xl uppercase tracking-tighter italic">
                  LİG <StyledText className="text-[#00ff85]">TABLOSU</StyledText>
                </StyledText>
                {isAdmin && (
                  <StyledTouch
                    onPress={handleCancelLeague}
                    className="ml-4 w-8 h-8 items-center justify-center bg-red-500/10 rounded-full border border-red-500/20 active:bg-red-500"
                  >
                    <Ionicons name="trash-outline" size={14} color="#ef4444" />
                  </StyledTouch>
                )}
              </StyledView>
              <StyledView className="bg-[#1a1d23] px-3 py-2.5 rounded-xl border border-white/10 shadow-lg flex-row items-center">
                <StyledView className="items-center px-2">
                  <StyledText className="text-white/40 font-black text-[8px]">O</StyledText>
                </StyledView>
                <StyledView className="w-[1px] h-3 bg-white/10 mx-1" />
                <StyledView className="items-center px-2">
                  <StyledText className="text-white/40 font-black text-[8px]">AV</StyledText>
                </StyledView>
                <StyledView className="w-[1px] h-3 bg-white/10 mx-1" />
                <StyledView className="items-center px-2">
                  <StyledText className="text-[#00ff85] font-black text-[8px]">PUAN</StyledText>
                </StyledView>
              </StyledView>
            </StyledView>
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              // refresh özelliği scrollview de
              refreshControl={
                <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor="#00ff85" />
              }
            >
              <StyledView className="bg-[#0b0e11] rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                {standings.map((item, index) => {
                  const isFirst = index === 0;
                  const isSecond = index === 1;
                  const isLast = index === standings.length - 1;
                  const averaj = (item.goals_for || 0) - (item.goals_against || 0);
                  return (
                    <StyledView
                      key={item.user_id}
                      className={`flex-row items-center py-4 px-2 border-b border-white/[0.02] ${isFirst ? 'bg-[#00ff85]/5' : ''}`}
                    >
                      <StyledView className="w-7 flex-row items-center">
                        <StyledView
                          className={`w-1 h-8 rounded-full mr-2 ${isFirst ? 'bg-[#00ff85]' : isSecond ? 'bg-blue-500' : 'bg-white/10'
                            }`}
                        />
                        <StyledText className={`font-black text-sm ${isFirst ? 'text-[#00ff85]' : 'text-white/60'}`}>
                          {index + 1}
                        </StyledText>
                      </StyledView>

                      <StyledView className="flex-1 flex-row items-center ml-1">
                        <StyledView className="relative">
                          <StyledView className="w-11 h-11 bg-[#1a1d23] rounded-xl items-center justify-center border border-white/10 shadow-sm">
                            {item.official_teams?.logo_url ? (
                              <Image
                                source={{ uri: item.official_teams.logo_url }}
                                className="w-9 h-9"
                                resizeMode="contain"
                              />
                            ) : (
                              <StyledText className="text-gray-600 font-black text-xs">{item.team_name?.[0]}</StyledText>
                            )}
                          </StyledView>
                          {isFirst && (
                            <StyledView className="absolute -top-2 -left-2 bg-[#f1c40f] w-5 h-5 rounded-full items-center justify-center border-2 border-[#0b0e11]">
                              <StyledText className="text-[10px]">👑</StyledText>
                            </StyledView>
                          )}
                        </StyledView>

                        <StyledView className="ml-2 flex-1">
                          <StyledView className="flex-row items-center">
                            <StyledText
                              numberOfLines={1}
                              className={`font-black text-[14px] tracking-tight ${isFirst ? 'text-[#00ff85]' : 'text-white'}`}
                              style={{ maxWidth: '65%' }}
                            >
                              {item.team_name}
                            </StyledText>

                            {nextMatch?.status === 'live' && (nextMatch.home_user_id === item.user_id || nextMatch.away_user_id === item.user_id) ? (
                              <StyledView className="flex-row items-center ml-1.5 bg-red-500 px-1 py-0.5 rounded-full">
                                <StyledView className="w-1 h-1 rounded-full bg-white mr-1" />
                                <StyledText className="text-[7px] font-black text-white uppercase">LIVE</StyledText>
                              </StyledView>
                            ) : null}

                            {item.motm_count && item.motm_count > 0 ? (
                              <StyledView
                                className="ml-1.5 flex-row items-center bg-[#f1c40f] px-1.5 py-0.5 rounded-md"
                              >
                                <StyledText className="text-black text-[9px] font-black">★</StyledText>
                                <StyledText className="ml-0.5 text-black text-[9px] font-[1000]">
                                  {item.motm_count}
                                </StyledText>
                              </StyledView>
                            ) : null}
                          </StyledView>

                          <StyledText className="text-white/40 text-[9px] font-bold tracking-widest uppercase mt-0.5">
                            @{item.profiles?.username || 'player'}
                          </StyledText>
                        </StyledView>
                      </StyledView>

                      <StyledView className="flex-row items-center">
                        <StyledView className="flex-row space-x-2 mr-2">
                          <StyledView className="items-center w-4">
                            <StyledText className="text-white/50 font-bold text-[11px]">{item.played}</StyledText>
                          </StyledView>
                          <StyledView className="items-center w-4">
                            <StyledText className={`font-bold text-[11px] ${averaj > 0 ? 'text-[#00ff85]' : averaj < 0 ? 'text-red-600' : 'text-white'}`}>
                              {averaj > 0 ? `+${averaj}` : averaj}
                            </StyledText>
                          </StyledView>
                        </StyledView>

                        <StyledView
                          className={`w-10 h-10 rounded-xl items-center justify-center border ${isFirst ? 'bg-[#00ff85] border-[#00ff85]' : 'bg-white/5 border-white/20'
                            }`}
                        >
                          <StyledText className={`font-[1000] text-[13px] ${isFirst ? 'text-black' : 'text-[#00ff85]'}`}>
                            {item.points}
                          </StyledText>
                        </StyledView>
                      </StyledView>
                    </StyledView>
                  );
                })}
              </StyledView>
            </ScrollView>
          </StyledView>
        ) : (
          <FixtureList fixture={fullFixture || []} isAdmin={isAdmin} />
        )}

        <ScoreEntryModal
          visible={scoreModalVisible}
          onClose={closeScoreModal}
          nextMatch={nextMatch}
          onSave={(h, a, motmId) => {
            handleScoreSave(h, a, motmId);
            closeScoreModal();
          }}
        />
      </StyledView>
    </ScreenWrapper>
  );
};