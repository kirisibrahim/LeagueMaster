import { PastLeagueModal } from '@/components/home/PastLeagueModal';
import { useAuthActions } from '@/hooks/useAuthActions';
import { useUserCareer } from '@/hooks/useCareer';
import { usePastLeagues } from '@/hooks/usePastLeagues';
import { useLeagueStore } from '@/store/useLeagueStore';
import { useFocusEffect } from '@react-navigation/native';
import { styled } from 'nativewind';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);

export default function ProfileScreen() {
  const { handleSignOut } = useAuthActions();
  const userProfile = useLeagueStore((state) => state.userProfile);
  const { stats, isLoading, resetStats, refetch: refetchStats } = useUserCareer();
  const { data: pastLeagues, refetch: refetchPast } = usePastLeagues();
  const [selectedLeague, setSelectedLeague] = useState<{ id: string, name: string } | null>(null);

  // FocusEffect ile otomatik tazeleme
useFocusEffect(
  React.useCallback(() => {
    if (refetchStats) refetchStats();
    if (refetchPast) refetchPast();
  }, [])
);

  // Rating Algoritması
  const ovr = useMemo(() => {
    if (!stats || stats.total_matches === 0) return 60;
    const winRate = (stats.total_wins / stats.total_matches) * 100;
    // Galibiyet oranı ağırlıklı bir puanlama (Max 99)
    const baseRating = 60 + (winRate * 0.39);
    return Math.min(Math.round(baseRating), 99);
  }, [stats]);

  const handleReset = () => {
    Alert.alert(
      "İstatistikleri Sıfırla",
      "Kariyerindeki tüm maç ve gol verileri silinecek. Bu işlem geri alınamaz!",
      [
        { text: "Vazgeç", style: "cancel" },
        { text: "Sıfırla", style: "destructive", onPress: () => resetStats.mutate() }
      ]
    );
  };

  if (isLoading) return (
    <StyledView className="flex-1 bg-[#0b0e11] justify-center">
      <ActivityIndicator color="#00ff85" />
    </StyledView>
  );

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-[#0b0e11]">
      <StyledView className="flex-1 p-6 items-center justify-top mt-12">

        {/* profil kartı */}
        <StyledView className="w-72 h-96 bg-[#1a1d23] rounded-[40px] border-2 border-[#00ff85] p-8 shadow-2xl shadow-[#00ff85]/20">

          <StyledView className="flex-row justify-between items-start">
            <StyledView>
              <StyledText className="text-[#00ff85] text-5xl font-black italic tracking-tighter">{ovr}</StyledText>
              <StyledText className="text-gray-500 font-black text-xs tracking-widest">
                {ovr >= 90 ? 'LEGEND' : ovr >= 80 ? 'WORLD CLASS' : 'AMATEUR'}
              </StyledText>
            </StyledView>
            <StyledView className="w-12 h-12 bg-[#2a2e35] rounded-2xl items-center justify-center border border-white/5">
              <StyledText className="text-white text-[10px] font-black text-center uppercase">
                {userProfile?.favorite_team?.substring(0, 3) || 'UT'}
              </StyledText>
            </StyledView>
          </StyledView>

          <StyledView className="mt-12 items-center">
            <StyledText className="text-white text-3xl font-black uppercase italic tracking-tighter" numberOfLines={1}>
              {userProfile?.username}
            </StyledText>
            <StyledView className="h-1 w-12 bg-[#00ff85] mt-3 rounded-full" />
          </StyledView>

          <StyledView className="mt-12 flex-row justify-between border-t border-white/5 pt-8">
            <StatItem label="MAÇ" value={stats?.total_matches || 0} />
            <StatItem label="GOL" value={stats?.goals_for || 0} />
            <StatItem
              label="WIN"
              value={`%${stats?.total_matches ? Math.round((stats.total_wins / stats.total_matches) * 100) : 0}`}
              isHighlight
            />
          </StyledView>
        </StyledView>

        {/* profil aksiyonları */}
        <StyledView className="w-full mt-12 space-y-4">
          <TouchableOpacity
            onPress={handleReset}
            className="w-full py-5 rounded-3xl bg-[#1a1d23] border border-white/5 items-center"
          >
            <StyledText className="text-gray-500 font-bold uppercase tracking-[2px] text-[10px]">
              Kariyeri Sıfırla
            </StyledText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSignOut}
            className="w-full py-5 rounded-3xl bg-red-500/10 border border-red-500/20 items-center"
          >
            <StyledText className="text-red-500 font-bold uppercase tracking-[2px] text-[10px]">
              Güvenli Çıkış Yap
            </StyledText>
          </TouchableOpacity>
        </StyledView>

        {/* geçmiş ligler ve turnuvalar */}
        <StyledView className="w-full mt-10">
          <StyledText className="text-white/30 font-black text-[10px] uppercase tracking-[3px] ml-1 mb-4">
            Müze & Arşiv
          </StyledText>

          {pastLeagues && pastLeagues.length > 0 ? (
            pastLeagues.map((item: any) => (
              <TouchableOpacity
                key={item.leagues.id}
                onPress={() => setSelectedLeague({ id: item.leagues.id, name: item.leagues.name })}
                activeOpacity={0.7}
                className="bg-[#1a1d23] rounded-3xl p-5 mb-3 border border-white/5 flex-row justify-between items-center"
              >
                <StyledView className="flex-row items-center">
                  <StyledView className="w-10 h-10 bg-[#f1c40f]/10 rounded-full items-center justify-center border border-[#f1c40f]/20 mr-3">
                    <StyledText className="text-lg">🏆</StyledText>
                  </StyledView>
                  <StyledView>
                    <StyledText className="text-white font-bold text-sm uppercase">
                      {item.leagues.name}
                    </StyledText>
                    <StyledText className="text-gray-500 text-[10px] font-bold">
                      {item.team_name} ile katıldı
                    </StyledText>
                  </StyledView>
                </StyledView>

                <StyledView className="bg-black/20 px-3 py-1.5 rounded-xl">
                  <StyledText className="text-[#00ff85] font-black text-[9px] uppercase italic">
                    DETAY
                  </StyledText>
                </StyledView>
              </TouchableOpacity>
            ))
          ) : (
            <StyledView className="bg-[#1a1d23]/50 rounded-3xl p-8 border border-dashed border-white/10 items-center">
              <StyledText className="text-gray-600 font-bold text-xs italic">
                Henüz tamamlanmış bir ligin yok.
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

// Atomik Stat Bileşeni
const StatItem = ({ label, value, isHighlight }: { label: string, value: string | number, isHighlight?: boolean }) => (
  <StyledView className="items-center">
    <StyledText className={`text-xl font-black italic ${isHighlight ? 'text-[#00ff85]' : 'text-white'}`}>
      {value}
    </StyledText>
    <StyledText className="text-gray-500 text-[9px] font-black uppercase tracking-widest mt-1">
      {label}
    </StyledText>
  </StyledView>
);