import { FullScreenLoading } from '@/components/common/FullScreenLoading';
import { DashboardView } from '@/components/home/DashboardView';
import { EntryView } from '@/components/home/EntryView';
import { useInitialCheck } from '@/hooks/useInitialCheck';
import { useLeagueDetails, useStandings } from '@/hooks/useLeagueData';
import { useLeagueStore } from '@/store/useLeagueStore';
import React from 'react';

export default function HomeScreen() {
  const { currentLeagueId } = useLeagueStore();
  const { isChecking } = useInitialCheck();

  // dataları merkezi tiplerle çekiyoruz
  const { 
    data: league, 
    isLoading: leagueLoading, 
    refetch: refetchLeague 
  } = useLeagueDetails(currentLeagueId);

  const { 
    data: standings, 
    isLoading: standingsLoading, 
    refetch: refetchStandings 
  } = useStandings(currentLeagueId);

  // hem ligi hem puan durumunu yeniler
  const handleRefresh = async () => {
    await Promise.all([refetchLeague(), refetchStandings()]);
  };

  // sistem kontrolü veya veri yükleniyorsa loading göster
  if (isChecking || (currentLeagueId && (leagueLoading || standingsLoading))) {
    return <FullScreenLoading message="Veriler Senkronize Ediliyor..." />;
  }

  // user bir lige dahil değilse giriş ekranı
  if (!currentLeagueId) {
    return <EntryView />;
  }

  // aktif lig varsa dashboarda yönlendir
  return (
    <DashboardView 
      league={league} 
      standings={standings || []} 
      onRefresh={handleRefresh} 
    />
  );
}