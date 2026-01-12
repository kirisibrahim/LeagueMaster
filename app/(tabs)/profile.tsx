import { PastLeagueModal } from '@/components/home/PastLeagueModal';
import { useAuthActions } from '@/hooks/useAuthActions';
import { useUserCareer } from '@/hooks/useCareer';
import { usePastLeagues } from '@/hooks/usePastLeagues';
import { useLeagueStore } from '@/store/useLeagueStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { MotiView } from 'moti';
import { styled } from 'nativewind';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { handleSignOut } = useAuthActions();
  const userProfile = useLeagueStore((state) => state.userProfile);
  const { stats, isLoading, resetStats, refetch: refetchStats } = useUserCareer();
  const { data: pastLeagues, refetch: refetchPast } = usePastLeagues();
  const [selectedLeague, setSelectedLeague] = useState<{ id: string, name: string } | null>(null);
  const showConfirm = useNotificationStore((state) => state.showConfirm);
  const hideNotification = useNotificationStore((state) => state.hideNotification);

  useFocusEffect(
    React.useCallback(() => {
      if (refetchStats) refetchStats();
      if (refetchPast) refetchPast();
    }, [])
  );

  const ovr = useMemo(() => {
    if (!stats || !stats.total_matches || stats.total_matches === 0) return 60;
    const winRate = (stats.total_wins / stats.total_matches) * 100;
    const baseRating = 60 + (winRate * 0.39);
    return Math.min(Math.round(baseRating), 99);
  }, [stats]);

  const handleReset = () => {
    showConfirm(
      "Kariyeri Sıfırla", // title
      "Kariyerindeki tüm maç ve gol verileri silinecek. Bu işlem geri alınamaz!",
      [
        {
          text: "Sıfırla",
          style: "destructive",
          onPress: () => {
            resetStats.mutate();
            hideNotification();
          }
        },
        {
          text: "Vazgeç",
          style: "cancel",
          onPress: () => hideNotification()
        }
      ]
    );
  };

  if (isLoading) return (
    <StyledView className="flex-1 bg-[#0b0e11] justify-center items-center">
      <ActivityIndicator color="#00ff85" size="large" />
    </StyledView>
  );

  return (
    <ScrollView
      contentContainerStyle={{
        paddingBottom: 100,
        paddingTop: insets.top
      }}
      className="bg-[#0b0e11]"
      showsVerticalScrollIndicator={false}
    >
      <StyledView className="p-6">
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 15 }}
          className="w-full aspect-[4/5] bg-[#1a1d23] rounded-[45px] border-2 border-[#00ff85] p-8 relative overflow-hidden shadow-2xl shadow-[#00ff85]/20"
        >
          <StyledView className="absolute -right-20 -top-20 w-64 h-64 bg-[#00ff85]/5 rounded-full" />

          <StyledView className="flex-row justify-between items-start">
            <StyledView>
              <StyledText className="text-[#00ff85] text-7xl font-black italic leading-none tracking-tighter">
                {ovr}
              </StyledText>
              <StyledText className="text-gray-500 font-bold text-[10px] tracking-[3px] mt-2">
                {ovr >= 85 ? 'EFSANE' : ovr >= 75 ? 'PROFESYONEL' : 'AMATÖR'}
              </StyledText>
            </StyledView>

            <StyledView className="w-20 h-20 bg-black/30 rounded-3xl items-center justify-center border border-white/10 shadow-lg">
              {userProfile?.logo_url ? (
                <StyledImage
                  source={{ uri: userProfile.logo_url }}
                  className="w-16 h-16"
                  resizeMode="contain"
                />
              ) : (
                <Ionicons name="shield" size={40} color="#333" />
              )}
            </StyledView>
          </StyledView>

          <StyledView className="mt-12 items-center">
            <StyledView className="h-1.5 w-20 bg-[#00ff85] mb-4 rounded-full shadow-lg shadow-[#00ff85]" />
            <StyledText className="text-white text-4xl font-black uppercase tracking-tighter text-center">
              {userProfile?.username}
            </StyledText>
            <StyledView className="h-1.5 w-20 bg-[#00ff85] mt-4 rounded-full shadow-lg shadow-[#00ff85]" />
          </StyledView>

          <StyledView className="mt-auto flex-row justify-between border-t border-white/5 pt-8">
            <StatItem label="MAÇ" value={stats?.total_matches ?? 0} />
            <StatItem label="GOL" value={stats?.goals_for ?? 0} />
            <StatItem
              label="G/M"
              value={stats?.total_matches > 0 ? (stats.goals_for / stats.total_matches).toFixed(1) : "0.0"}
            />
            <StatItem
              label="WIN RATE"
              value={`%${stats?.total_matches > 0 ? Math.round((stats.total_wins / stats.total_matches) * 100) : 0}`}
              isHighlight
            />
          </StyledView>
        </MotiView>

        <StyledView className="flex-row justify-between mt-8">
          <ActionButton
            label="SIFIRLA"
            icon="refresh-outline"
            onPress={handleReset}
            variant="secondary"
          />
          <ActionButton
            label="ÇIKIŞ"
            icon="log-out-outline"
            onPress={handleSignOut}
            variant="danger"
          />
        </StyledView>

        <StyledView className="mt-12">
          <StyledView className="flex-row items-center justify-between mb-6 px-2">
            <StyledText className="text-white font-black text-xs uppercase tracking-[3px]">
              Müze & Arşiv
            </StyledText>
            <StyledView className="h-[1px] flex-1 bg-white/10 ml-4" />
          </StyledView>

          {pastLeagues && pastLeagues.length > 0 ? (
            pastLeagues.map((item: any) => (
              <MotiView
                key={item.leagues.id}
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 200 }}
              >
                <TouchableOpacity
                  onPress={() => setSelectedLeague({ id: item.leagues.id, name: item.leagues.name })}
                  activeOpacity={0.8}
                  className="bg-[#1a1d23] rounded-[30px] p-5 mb-4 border border-white/5 flex-row items-center shadow-sm"
                >
                  <StyledView className="w-14 h-14 bg-yellow-500/10 rounded-2xl items-center justify-center border border-yellow-500/20 mr-4">
                    <Ionicons name="trophy" size={24} color="#f1c40f" />
                  </StyledView>
                  <StyledView className="flex-1">
                    <StyledText className="text-white font-bold text-base uppercase italic tracking-tighter">
                      {item.leagues.name}
                    </StyledText>
                    <StyledText className="text-gray-500 text-[10px] font-bold uppercase">
                      {item.team_name} • Sezon Sonu
                    </StyledText>
                  </StyledView>
                  <Ionicons name="chevron-forward" size={20} color="#333" />
                </TouchableOpacity>
              </MotiView>
            ))
          ) : (
            <StyledView className="bg-[#1a1d23]/50 rounded-[35px] p-10 border border-dashed border-white/10 items-center">
              <Ionicons name="medal-outline" size={40} color="#222" />
              <StyledText className="text-gray-600 font-bold text-xs italic mt-4 text-center">
                Henüz tamamlanmış bir ligin yok.{"\n"}Tarih yazmaya başla!
              </StyledText>
            </StyledView>
          )}
        </StyledView>

      </StyledView>

      <PastLeagueModal
        visible={!!selectedLeague}
        onClose={() => setSelectedLeague(null)}
        leagueId={selectedLeague?.id || null}
        leagueName={selectedLeague?.name || ''}
      />
    </ScrollView>
  );
}

const StatItem = ({ label, value, isHighlight }: any) => (
  <StyledView className="items-center">
    <StyledText className={`text-2xl font-black italic ${isHighlight ? 'text-[#00ff85]' : 'text-white'}`}>
      {value}
    </StyledText>
    <StyledText className="text-gray-600 text-[8px] font-black uppercase tracking-widest mt-1">
      {label}
    </StyledText>
  </StyledView>
);

const ActionButton = ({ label, icon, onPress, variant }: any) => (
  <TouchableOpacity
    onPress={onPress}
    className={`flex-row items-center justify-center space-x-2 py-4 rounded-2xl border w-[48%] ${variant === 'danger' ? 'bg-red-500/10 border-red-500/20' : 'bg-[#1a1d23] border-white/5'
      }`}
  >
    <Ionicons name={icon} size={18} color={variant === 'danger' ? '#ef4444' : '#555'} />
    <StyledText className={`font-black text-[10px] uppercase tracking-[1px] ${variant === 'danger' ? 'text-red-500' : 'text-gray-500'
      }`}>
      {label}
    </StyledText>
  </TouchableOpacity>
);