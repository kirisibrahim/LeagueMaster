import { supabase } from '@/api/supabase';
import ScreenWrapper from '@/components/common/ScreenWrapper';
import { useLeagueActions } from '@/hooks/useLeagueActions';
import { useLobby } from '@/hooks/useLobby';
import { useLeagueStore } from '@/store/useLeagueStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { handleAppError } from '@/utils/errorHandler';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { styled } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Share, Text, TouchableOpacity, View } from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);

interface Props {
  league: any;
  isAdmin: boolean;
  onRefresh: () => void;
}

export default function LobbyView({ league, isAdmin, onRefresh }: Props) {
  const { showNotification, showConfirm } = useNotificationStore();
  const [actionLoading, setActionLoading] = useState(false);
  const { userProfile } = useLeagueStore();
  const { deleteLeague, leaveLeague } = useLeagueActions();
  const queryClient = useQueryClient();
  const { data: lobbyData, isLoading } = useLobby(league?.id);

  const participants = lobbyData?.participants || [];

  useEffect(() => {
    if (!league?.id) return;

    const lobbyChannel = supabase
      .channel(`lobby_${league.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Her türlü değişikliği dinle
          schema: 'public',
          table: 'league_participants',
          filter: `league_id=eq.${league.id}`,
        },
        (payload) => {
          console.log("Canlı veri değişikliği:", payload.eventType);
          // Herhangi bir değişiklikte (ekleme/silme) listeyi yenile
          onRefresh();
        }
      )
      .subscribe();

    // Temizlik (Cleanup): Ekrandan çıkınca aboneliği iptal et (Senior dokunuşu)
    return () => {
      supabase.removeChannel(lobbyChannel);
    };
  }, [league?.id]);

  const handleStartEngine = async () => {
    if (participants.length < 2) {
      Alert.alert('Hata', 'Ligi başlatmak için en az 2 kişi gerekiyor.');
      return;
    }
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('start_league_engine', { p_league_id: league.id });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['league_details'] });
      onRefresh();
    } catch (error: any) {
      handleAppError(error, "StartEngine");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExitAction = () => {
    if (isAdmin) {
      // ADMIN İÇİN: Lobi İptali (Kritik İşlem)
      showConfirm(
        'DİKKAT: Lobi Siliniyor!',
        'Bu turnuvayı iptal etmek üzeresin. Tüm katılımcılar lobiden atılacak ve bu işlem geri alınamaz. Emin misin?',
        [
          {
            text: 'VAZGEÇ',
            onPress: () => { }, // Sadece kapatır
            style: 'cancel'
          },
          {
            text: 'EVET, LİGİ SİL',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteLeague(league.id);
                showNotification('Lobi başarıyla imha edildi.', 'info');
              } catch (error) {
                showNotification('Lobi silinirken bir hata oluştu.', 'error');
              }
            }
          }
        ]
      );
    } else {
      // KATILIMCI İÇİN: Lobiden Ayrılma
      showConfirm(
        'Lobiden Ayrıl',
        'Bu arenadan ayrılmak istediğine emin misin? Takımın listeden silinecek.',
        [
          { text: 'VAZGEÇ', onPress: () => { }, style: 'cancel' },
          {
            text: 'AYRIL',
            style: 'destructive',
            onPress: async () => {
              try {
                await leaveLeague(league.id, userProfile!.id);
                showNotification('Lobiden ayrıldın.', 'info');
              } catch (error) {
                showNotification('Ayrılma işlemi başarısız.', 'error');
              }
            }
          }
        ]
      );
    }
  };

  const copyToClipboard = async () => {
    try {
      // expo-clipboard ile async güvenli kopyalama
      await Clipboard.setStringAsync(league?.invite_code);

      showNotification('Davet kodu başarıyla kopyalandı!', 'success');
    } catch (error) {
      showNotification('Kopyalama sırasında bir hata oluştu.', 'error');
    }
  };

  const onShareInvite = async () => {
    try {
      await Share.share({
        message: `🎮 ${league?.name} Ligimize Katıl!\n🔑 Kod: ${league?.invite_code}`,
      });
    } catch (error) { console.error(error); }
  };
  const handleKickPlayer = async (participantId: string, teamName: string) => {
    try {
      const { error } = await supabase
        .from('league_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;

      showNotification(`${teamName} lobiden atıldı.`, 'success');
      onRefresh();

    } catch (error: any) {
      showNotification('Hata oluştu', 'error');
    }
  };

  return (
    <ScreenWrapper>
      <StyledView className="flex-1 bg-[#0b0e11] px-6">

        {/* 1. DAVET KODU KARTI */}
        <StyledView className="mt-2 bg-[#1a1d23] p-4 rounded-[24px] border border-[#00ff85]/20 items-center">
          <StyledText className="text-gray-500 text-[9px] font-bold uppercase tracking-[3px] mb-2">Lobi Erişim Kodu</StyledText>
          <StyledText className="text-white text-4xl font-black italic tracking-[6px] mb-2">
            {league?.invite_code}
          </StyledText>

          <StyledView className="flex-row w-full justify-between gap-x-3">
            <TouchableOpacity
              onPress={copyToClipboard}
              className="flex-1 bg-[#0b0e11] flex-row h-12 rounded-2xl items-center justify-center border border-gray-800"
            >
              <Ionicons name="copy-outline" size={18} color="#00ff85" />
              <StyledText className="text-white font-bold ml-2 text-xs">Kopyala</StyledText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onShareInvite}
              className="flex-1 bg-[#00ff85] flex-row h-12 rounded-2xl items-center justify-center"
            >
              <Ionicons name="share-social" size={18} color="black" />
              <StyledText className="text-black font-black ml-2 uppercase italic text-[10px]">Paylaş</StyledText>
            </TouchableOpacity>
          </StyledView>
        </StyledView>

        {/* 2. LİG BAŞLIĞI */}
        <StyledView className="mt-6 mb-4 px-4">
          <StyledView className="flex-row items-center justify-between">
            <StyledView className="flex-row items-center">
              <StyledView className="w-[1.5px] h-8 bg-[#00ff85] mr-3 opacity-60" />
              <StyledView>
                <StyledText className="text-white text-lg font-bold uppercase tracking-tight leading-tight">
                  {league?.name}
                </StyledText>
                <StyledView className="flex-row items-center">
                  <StyledText className="text-gray-500 font-bold uppercase text-[8px] tracking-[1.5px]">
                    LOBİDEKİ OYUNCULAR
                  </StyledText>
                  <StyledView className="w-1 h-1 rounded-full bg-gray-800 mx-2" />
                  <StyledText className="text-[#00ff85] font-black text-[8px] uppercase">
                    CANLI
                  </StyledText>
                </StyledView>
              </StyledView>
            </StyledView>
            <StyledView className="flex-row items-center bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
              <StyledText className="text-[#00ff85] text-sm font-black italic mr-2">
                {participants.length.toString().padStart(2)}
              </StyledText>
              <StyledView className="w-[1px] h-3 bg-gray-800 mr-2" />
              <StyledText className="text-gray-400 text-[9px] font-bold uppercase tracking-tighter">
                HAZIR
              </StyledText>
            </StyledView>
          </StyledView>
        </StyledView>

        {/* 3. KATILIMCI LİSTESİ - Flex-1 ile Butonlara Kadar Alanı Kaplar */}
        <StyledView className="flex-1 px-4">
          <FlatList
            data={participants}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 180, paddingTop: 10 }}
            renderItem={({ item, index }) => {
              const isLeader = item.user_id === league.admin_id;
              // Mevcut kullanıcı admin mi ve bu satırdaki kişi kendisi mi?
              const isMe = item.user_id === userProfile?.id;
              const canKick = isAdmin && !isLeader; // Sadece admin başkasını atabilir

              return (
                <StyledView
                  className={`flex-row items-center h-16 px-4 rounded-2xl mb-2.5 border ${isLeader
                    ? 'bg-[#1a1d23] border-[#00ff85]/30'
                    : 'bg-[#0b0e11]/50 border-gray-800/40'
                    }`}
                >
                  {/* Sol: Sıralama ve Ayrım */}
                  <StyledView className="flex-row items-center mr-4">
                    <StyledText className={`font-black italic text-[10px] w-5 ${isLeader ? 'text-[#00ff85]' : 'text-gray-700'}`}>
                      {(index + 1).toString().padStart(2)}
                    </StyledText>
                    <StyledView className={`w-[1px] h-6 ${isLeader ? 'bg-[#00ff85]/40' : 'bg-gray-800'} ml-1`} />
                  </StyledView>

                  {/* Orta: Bilgiler */}
                  <StyledView className="flex-1">
                    <StyledText
                      numberOfLines={1}
                      className={`font-bold text-[13px] uppercase tracking-tight ${isLeader ? 'text-[#00ff85]' : 'text-gray-200'}`}
                    >
                      {item.team_name}
                    </StyledText>
                    <StyledText className="text-gray-600 text-[9px] font-medium tracking-wider mt-0.5">
                      @{item.profiles?.username || 'oyuncu'}
                    </StyledText>
                  </StyledView>

                  {/* Sağ: Rol ve Aksiyon Alanı */}
                  <StyledView className="flex-row items-center">
                    {/* Rol Etiketi */}
                    <StyledView className={`px-3 py-1 rounded-lg border ${isLeader ? 'bg-[#00ff85]/5 border-[#00ff85]/10' : 'bg-gray-800/20 border-gray-800/40'
                      }`}>
                      <StyledText className={`text-[7px] font-black uppercase tracking-[1px] ${isLeader ? 'text-[#00ff85]' : 'text-gray-500'
                        }`}>
                        {isLeader ? 'YÖNETİCİ' : 'OYUNCU'}
                      </StyledText>
                    </StyledView>

                    {/* Kick (Atma) Butonu - Sadece Admin Başkası İçin Görür */}
                    {canKick && (
                      <TouchableOpacity
                        onPress={() => {
                          showConfirm(
                            'Oyuncuyu Uzaklaştır',
                            `${item.team_name} takımını lobiden atmak istediğine emin misin?`,
                            [
                              { text: 'İPTAL', style: 'cancel', onPress: () => { } },
                              {
                                text: 'LOBİDEN AT',
                                style: 'destructive',
                                onPress: () => handleKickPlayer(item.id, item.team_name)
                              }
                            ]
                          );
                        }}
                        className="ml-3 w-8 h-8 rounded-full bg-red-500/10 items-center justify-center border border-red-500/20"
                      >
                        <Ionicons name="close" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </StyledView>
                </StyledView>
              );
            }}
          />
        </StyledView>
        {/* 4. AKSİYON ALANI - Tab Bar'ın Hemen Üstünde */}
        <StyledView className="absolute bottom-0 left-6 right-6 bg-[#0b0e11]/95 pt-2">
          {isAdmin ? (
            <StyledView>
              {/* ANA AKSİYON: BAŞLAT */}
              <TouchableOpacity
                onPress={handleStartEngine}
                disabled={actionLoading || participants.length < 2}
                className={`flex-row h-14 rounded-2xl items-center justify-center shadow-lg mb-3 ${participants.length < 2 ? 'bg-gray-800' : 'bg-[#00ff85]'
                  }`}
              >
                {actionLoading ? (
                  <ActivityIndicator color="black" />
                ) : (
                  <>
                    <StyledText className={`font-black text-base uppercase mr-2 italic ${participants.length < 2 ? 'text-gray-500' : 'text-black'}`}>
                      Savaşı Başlat
                    </StyledText>
                    <Ionicons name="flash" size={18} color={participants.length < 2 ? "#4b5563" : "black"} />
                  </>
                )}
              </TouchableOpacity>

              {/* KRİTİK AKSİYON: İPTAL ET (Belirginleştirildi) */}
              <TouchableOpacity
                onPress={handleExitAction}
                className="h-14 rounded-2xl items-center justify-center border-2 border-red-500/50 bg-red-500/10 active:bg-red-500/20"
              >
                <StyledView className="flex-row items-center">
                  <Ionicons name="alert-circle-outline" size={16} color="#ef4444" className="mr-2" />
                  <StyledText className="text-red-500 font-black uppercase tracking-[1px] text-xs">
                    Turnuvayı İptal Et ve Sil
                  </StyledText>
                </StyledView>
              </TouchableOpacity>
            </StyledView>
          ) : (
            <StyledView>
              <StyledView className="bg-[#1a1d23] p-4 rounded-2xl border border-gray-800 items-center mb-2">
                <ActivityIndicator color="#00ff85" size="small" />
                <StyledText className="text-gray-400 font-bold text-[9px] mt-2 uppercase tracking-widest">
                  Yönetici Bekleniyor...
                </StyledText>
              </StyledView>

              <TouchableOpacity
                onPress={handleExitAction}
                className="h-12 rounded-2xl items-center justify-center border-2 border-gray-700 bg-gray-800/30"
              >
                <StyledText className="text-gray-400 font-bold uppercase text-xs tracking-widest">Lobiden Ayrıl</StyledText>
              </TouchableOpacity>
            </StyledView>
          )}
        </StyledView>

      </StyledView>
    </ScreenWrapper>
  );
}