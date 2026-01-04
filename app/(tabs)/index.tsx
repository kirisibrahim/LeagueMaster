import { FullScreenLoading } from '@/components/common/FullScreenLoading';
import { DashboardView } from '@/components/home/DashboardView';
import { EntryView } from '@/components/home/EntryView';
import { useInitialCheck } from '@/hooks/useInitialCheck';
import { useLeagueDetails, useStandings } from '@/hooks/useLeagueData';
import { useLeagueStore } from '@/store/useLeagueStore';
import React, { useEffect } from 'react';

export default function HomeScreen() {
  const { currentLeagueId, isLoading: storeLoading } = useLeagueStore();
  const { isChecking } = useInitialCheck();

  const queryId = currentLeagueId ?? null;

  const {
    data: league,
    status: leagueStatus,
    refetch: refetchLeague
  } = useLeagueDetails(queryId);

  const {
    data: standings,
    status: standingsStatus,
    refetch: refetchStandings
  } = useStandings(queryId);

  // yeni lig kurulduğunda veya ID değiştiğinde verileri tazele
  useEffect(() => {
    if (currentLeagueId) {
      refetchLeague();
      refetchStandings();
    }
  }, [currentLeagueId]);

  const handleRefresh = async () => {
    await Promise.all([refetchLeague(), refetchStandings()]);
  };

  // kontrol
  if (storeLoading || isChecking) {
    return <FullScreenLoading message="Hazırlanıyor..." />;
  }

  // lig yoksa lobiye git
  if (currentLeagueId === null) {
    return <EntryView />;
  }

  // veri yoksa loading göster arka plan güncellemelerinde ekranı kapatma
  const isPending = leagueStatus === 'pending' || standingsStatus === 'pending';
  
  if (isPending && !league) {
    return <FullScreenLoading message="Lig Verileri Alınıyor..." />;
  }

  // başarılı ise
  return (
    <DashboardView
      league={league}
      standings={standings || []}
      onRefresh={handleRefresh}
    />
  );
}