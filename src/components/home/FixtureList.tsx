import { useUndoMatch } from '@/hooks/useLeagueData';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Match } from '@/types/database';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styled } from 'nativewind';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouch = styled(TouchableOpacity);

interface FixtureListProps {
  fixture: Match[];
  isAdmin: boolean;
}

export const FixtureList = ({ fixture, isAdmin }: FixtureListProps) => {
  const undoMatch = useUndoMatch();
  const { showNotification, showConfirm } = useNotificationStore();

  const handleUndo = (matchId: string) => {
    showConfirm(
      "🔄 MAÇI GERİ AL",
      "Bu maçın skorları tamamen silinecek ve durumu 'OYNANMADI' olarak güncellenecektir. Puan tablosu bu değişikliğe göre anlık olarak güncellenir. Emin misin?",
      [
        {
          text: "VAZGEÇ",
          style: "cancel",
          onPress: () => { } //ts için boş fonksiyon
        },
        {
          text: "EVET, GERİ AL",
          style: "destructive",
          onPress: async () => {
            try {
              await undoMatch.mutateAsync(matchId);
              showNotification("Maç başarıyla geri alındı.", "info");
            } catch (error) {
              showNotification("Geri alma işlemi başarısız.", "error");
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      className="px-2 pt-4"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {fixture.map((match, index) => {
        const isCompleted = match.is_completed;
        const homeScore = match.home_score ?? 0;
        const awayScore = match.away_score ?? 0;

        const homeWin = isCompleted && homeScore > awayScore;
        const awayWin = isCompleted && awayScore > homeScore;

        return (
          <StyledView key={match.id} className="mb-10 relative" style={{ overflow: 'visible' }}>

            <StyledView
              className="absolute -top-3 left-0 right-0 items-center z-30"
              style={{ elevation: 16 }}
            >
              <StyledView
                className="bg-[#1a1d23] px-1 py-1 rounded-full border border-white/10 shadow-xl"
              >
                <StyledText className="text-[9px] font-[1000] text-white/50 uppercase tracking-[3px]">
                  KARŞILAŞMA <StyledText className="text-[#00ff85]">#{index + 1}</StyledText>
                </StyledText>
              </StyledView>
            </StyledView>

            <StyledView
              className={`flex-row items-center py-5 px-3 rounded-[32px] border relative ${isCompleted
                ? 'bg-[#1a1d23] border-white/5 shadow-2xl'
                : 'bg-[#1a1d23]/20 border-white/5 border-dashed opacity-80'
                }`}
              style={{ zIndex: 10 }}
            >
              <StyledView className="flex-1 flex-row items-center justify-end">
                <StyledText
                  numberOfLines={1}
                  className={`text-right font-black text-[10px] uppercase tracking-tighter mr-2 flex-1 ${homeWin ? 'text-[#00ff85]' : isCompleted ? 'text-white/40' : 'text-white/80'
                    }`}
                >
                  {match.home_participant?.team_name}
                </StyledText>

                <StyledView className={`w-9 h-9 rounded-xl items-center justify-center border ${homeWin ? 'border-[#00ff85]/40 bg-[#00ff85]/5' : 'border-white/5 bg-black/20'
                  }`}>
                  <Image
                    source={{ uri: (match.home_participant as any)?.official_teams?.logo_url }}
                    className="w-6 h-6"
                    resizeMode="contain"
                  />
                </StyledView>
              </StyledView>

              <StyledView className="mx-2 items-center justify-center w-20">
                {isCompleted ? (
                  <StyledView className="bg-[#00ff85] px-4 py-1.5 rounded-2xl shadow-xl shadow-[#00ff85]/20">
                    <StyledText className="text-black font-[1000] text-lg tracking-tight">
                      {homeScore} - {awayScore}
                    </StyledText>
                  </StyledView>
                ) : (
                  <StyledView className="w-10 h-10 rounded-full border border-white/10 items-center justify-center bg-white/5">
                    <StyledText className="text-white/40 font-black text-[9px]">VS</StyledText>
                  </StyledView>
                )}
              </StyledView>

              <StyledView className="flex-1 flex-row items-center">
                <StyledView className={`w-9 h-9 rounded-xl items-center justify-center border ${awayWin ? 'border-[#00ff85]/40 bg-[#00ff85]/5' : 'border-white/5 bg-black/20'
                  }`}>
                  <Image
                    source={{ uri: (match.away_participant as any)?.official_teams?.logo_url }}
                    className="w-6 h-6"
                    resizeMode="contain"
                  />
                </StyledView>

                <StyledText
                  numberOfLines={1}
                  className={`ml-2 font-black text-[10px] uppercase tracking-tighter flex-1 ${awayWin ? 'text-[#00ff85]' : isCompleted ? 'text-white/40' : 'text-white/80'
                    }`}
                >
                  {match.away_participant?.team_name}
                </StyledText>
              </StyledView>

              {isAdmin && isCompleted && (
                <StyledTouch
                  onPress={() => handleUndo(match.id)}
                  className="absolute -right-1 -top-1 bg-[#1a1d23] w-9 h-9 rounded-full items-center justify-center border-2 border-red-500 shadow-xl z-50 active:scale-90"
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <StyledView className="bg-red-500 w-full h-full rounded-full items-center justify-center border-2 border-[#1a1d23]">
                    <MaterialCommunityIcons name="undo-variant" size={16} color="white" />
                  </StyledView>
                </StyledTouch>
              )}
            </StyledView>

            {isCompleted && match.motm_user_id && (
              <StyledView
                className="absolute bottom-[-14px] left-0 right-0 items-center justify-center z-40"
                style={{ elevation: 20 }}
              >
                <StyledView className="flex-row items-center bg-[#f1c40f] px-1 py-0.5 rounded-full border-2 border-[#1a1d23] shadow-2xl">
                  <StyledView className="w-6 h-6 bg-black/20 rounded-full items-center justify-center mr-1">
                    <Image
                      source={{
                        uri: match.motm_user_id === match.home_user_id
                          ? (match.home_participant as any)?.official_teams?.logo_url
                          : (match.away_participant as any)?.official_teams?.logo_url
                      }}
                      className="w-5 h-5"
                      resizeMode="contain"
                    />
                  </StyledView>

                  <StyledText className="text-[9px] font-[1000] text-black uppercase tracking-tight">
                    🏆 {match.motm_user_id === match.home_user_id ? 'EV SAHİBİ' : 'DEPLASMAN'} MVP
                  </StyledText>
                </StyledView>
              </StyledView>
            )}
          </StyledView>
        );
      })}
    </ScrollView>
  );
};