import { useUserMatches } from '@/hooks/useUserMatches';
import { useLeagueStore } from '@/store/useLeagueStore';
import * as Haptics from 'expo-haptics';
import { AnimatePresence, MotiView } from 'moti';
import { styled } from 'nativewind';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouch = styled(TouchableOpacity);

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'played' | 'pending'>('played');
  const userProfile = useLeagueStore((state) => state.userProfile);
  const currentLeagueId = useLeagueStore((state) => state.currentLeagueId);
  const isStoreSyncing = useLeagueStore((state) => state.isLoading);

  const { data: matches, isLoading: isQueryLoading } = useUserMatches();

  const handleTabChange = async (tab: 'played' | 'pending') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveTab(tab);
  };

  const filteredMatches = useMemo(() => {
    if (isStoreSyncing || !currentLeagueId || !matches) return [];
    return matches.filter(m => {
      const isThisLeague = String(m.league_id) === String(currentLeagueId);
      const isFinished = Boolean(m.is_completed);
      return isThisLeague && (activeTab === 'played' ? isFinished : !isFinished);
    });
  }, [matches, activeTab, currentLeagueId, isStoreSyncing]);

  if (isStoreSyncing) {
    return (
      <StyledView className="flex-1 bg-[#0b0e11] justify-center items-center">
        <ActivityIndicator color="#00ff85" size="large" />
      </StyledView>
    );
  }

  return (
    <StyledView className="flex-1 bg-[#0b0e11] px-4" style={{ paddingTop: insets.top }}>
      <MotiView
        from={{ opacity: 0, translateX: -20 }}
        animate={{ opacity: 1, translateX: 0 }}
        className="mb-4 mt-4"
      >
        <StyledText className="text-white text-3xl font-black italic tracking-tighter uppercase">
          MAÇ <StyledText className="text-[#00ff85]">MERKEZİ</StyledText>
        </StyledText>
        <StyledText className="text-gray-500 text-[10px] font-bold uppercase tracking-[2px] mt-1">
          {userProfile?.username?.toUpperCase()} • REKABET ANALİZİ
        </StyledText>
      </MotiView>

      <StyledView className="flex-row bg-[#1a1d23] p-2 rounded-xl mb-4 border border-white/5 relative">
        {(['played', 'pending'] as const).map((tab) => (
          <StyledTouch
            key={tab}
            onPress={() => handleTabChange(tab)}
            className="flex-1 py-3 rounded-xl items-center z-10"
          >
            <StyledText className={`font-black uppercase text-[10px] tracking-[2px] ${activeTab === tab ? 'text-black' : 'text-gray-500'}`}>
              {tab === 'played' ? 'Geçmiş Maçlar' : 'Yaklaşanlar'}
            </StyledText>
          </StyledTouch>
        ))}

        <MotiView
          animate={{
            translateX: activeTab === 'played' ? 0 : (width - 44) / 2,
          }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 200,
            mass: 0.5
          }}
          className="absolute top-1.5 bottom-1.5 left-1.5 w-[49%] bg-[#00ff85] rounded-xl"
        />
      </StyledView>

      <ScrollView showsVerticalScrollIndicator={false}>
        <AnimatePresence exitBeforeEnter>
          {isQueryLoading ? (
            <MotiView key="loading" exit={{ opacity: 0 }}>
              <ActivityIndicator color="#00ff85" className="mt-10" />
            </MotiView>
          ) : !currentLeagueId ? (
            <MotiView
              key="no-league"
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-20 items-center justify-center"
            >
              <StyledText className="text-gray-500 font-black uppercase text-[10px] tracking-[3px] text-center">
                Aktif bir turnuvada değilsin
              </StyledText>
            </MotiView>
          ) : (
            <MotiView
              key={`list-${activeTab}`}
              from={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ type: 'timing', duration: 200 }}
            >
              {filteredMatches.map((match, index) => (
                <MatchItem key={match.id} match={match} currentUserId={userProfile?.id} index={index} />
              ))}
            </MotiView>
          )}
        </AnimatePresence>
      </ScrollView>
    </StyledView>
  );
}

const MatchItem = ({ match, currentUserId, index }: { match: any; currentUserId?: string; index: number }) => {
  const isHomeWinner = match.is_completed && (match.home_score ?? 0) > (match.away_score ?? 0);
  const isAwayWinner = match.is_completed && (match.away_score ?? 0) > (match.home_score ?? 0);

  const homeLogo = match.home_participant?.official_teams?.logo_url;
  const awayLogo = match.away_participant?.official_teams?.logo_url;

  // MVP'nin hangi tarafta olduğunu kontrol ediyoruz
  const isHomeMVP = match.motm_user_id === match.home_user_id;
  const isAwayMVP = match.motm_user_id === match.away_user_id;

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 250, delay: index * 40 }}
      className="bg-[#1a1d23] mb-4 p-2 rounded-xl border border-white/5 overflow-hidden shadow-sm"
    >

      {isHomeWinner && <StyledView className="absolute left-0 top-0 bottom-0 w-3 bg-[#00ff85]" />}
      {isAwayWinner && <StyledView className="absolute right-0 top-0 bottom-0 w-3 bg-[#00ff85]" />}

      <StyledView className="flex-row justify-between items-center">

        <StyledView className="items-center flex-1">
          <StyledView className="relative">
            <StyledView className={`w-16 h-16 rounded-full bg-black/40 items-center justify-center border-2 ${match.home_user_id === currentUserId ? 'border-[#00ff85]/50' : 'border-white/5'} overflow-hidden`}>
              {homeLogo ? (
                <Image
                  source={{ uri: homeLogo }}
                  className="w-12 h-12"
                  style={{ resizeMode: 'contain' }}
                />
              ) : (
                <StyledText className="text-xs opacity-30">Home</StyledText>
              )}
            </StyledView>

            {isHomeMVP && (
              <StyledView className="absolute -bottom-1 -right-1 bg-[#f1c40f] rounded-full p-1 border-2 border-[#1a1d23] shadow-lg">
                <StyledText className="text-[10px]">🌟</StyledText>
              </StyledView>
            )}

            {isHomeWinner && (
              <StyledView className="absolute -top-1 -right-1 bg-[#00ff85] rounded-full px-1.5 py-0.5 border-2 border-[#1a1d23]">
                <StyledText className="text-[7px] text-black font-black italic">Kazandı</StyledText>
              </StyledView>
            )}
          </StyledView>

          <StyledText
            className={`font-black text-md uppercase mt-2 tracking-tighter ${match.home_user_id === currentUserId ? 'text-[#00ff85]' : 'text-white'}`}
            numberOfLines={1}
          >
            {match.home_participant?.profiles?.username || '---'}
          </StyledText>
          <StyledText className="text-gray-500 font-bold text-[7px] uppercase tracking-widest">
            {match.home_participant?.team_name}
          </StyledText>
        </StyledView>

        <StyledView className="px-2 items-center justify-center">
          <StyledView className="flex-row items-center justify-center">
            <StyledText className={`text-3xl font-black italic ${isHomeWinner ? 'text-[#00ff85]' : 'text-white'}`}>
              {match.is_completed ? match.home_score : '-'}
            </StyledText>

            <StyledView className="mx-3 bg-white/5 px-2 py-1 rounded-lg">
              <StyledText className="text-white/20 font-black italic text-[10px]">VS</StyledText>
            </StyledView>

            <StyledText className={`text-3xl font-black italic ${isAwayWinner ? 'text-[#00ff85]' : 'text-white'}`}>
              {match.is_completed ? match.away_score : '-'}
            </StyledText>
          </StyledView>
        </StyledView>

        <StyledView className="items-center flex-1">
          <StyledView className="relative">
            <StyledView className={`w-16 h-16 rounded-full bg-black/40 items-center justify-center border-2 ${match.away_user_id === currentUserId ? 'border-[#00ff85]/50' : 'border-white/5'} overflow-hidden`}>
              {awayLogo ? (
                <Image
                  source={{ uri: awayLogo }}
                  className="w-12 h-12"
                  style={{ resizeMode: 'contain' }}
                />
              ) : (
                <StyledText className="text-xs opacity-30">Away</StyledText>
              )}
            </StyledView>

            {isAwayMVP && (
              <StyledView className="absolute -bottom-1 -left-1 bg-[#f1c40f] rounded-full p-1 border-2 border-[#1a1d23] shadow-lg">
                <StyledText className="text-[10px]">🌟</StyledText>
              </StyledView>
            )}

            {isAwayWinner && (
              <StyledView className="absolute -top-1 -left-1 bg-[#00ff85] rounded-full px-1.5 py-0.5 border-2 border-[#1a1d23]">
                <StyledText className="text-[7px] text-black font-black italic">Kazandı</StyledText>
              </StyledView>
            )}
          </StyledView>

          <StyledText
            className={`font-black text-md uppercase mt-2 tracking-tighter ${match.away_user_id === currentUserId ? 'text-[#00ff85]' : 'text-white'}`}
            numberOfLines={1}
          >
            {match.away_participant?.profiles?.username || '---'}
          </StyledText>
          <StyledText className="text-gray-500 font-bold text-[7px] uppercase tracking-widest">
            {match.away_participant?.team_name}
          </StyledText>
        </StyledView>

      </StyledView>
    </MotiView>
  );
};