// (tabs)/index.tsx
import { FullScreenLoading } from '@/components/common/FullScreenLoading';
import { DashboardView } from '@/components/home/DashboardView';
import { EntryView } from '@/components/home/EntryView';
import { useInitialCheck } from '@/hooks/useInitialCheck';
import { useLeagueDetails, useStandings } from '@/hooks/useLeagueData';
import { useLeagueStore } from '@/store/useLeagueStore';
import React from 'react';

export default function HomeScreen() {
  // 1. ADIM: TÜM HOOK'LAR EN ÜSTTE OLMALI (React Kuralı)
  const { currentLeagueId, userProfile, isLoading: storeLoading } = useLeagueStore();
  const { isChecking } = useInitialCheck();

  // queryId'yi burada tanımlıyoruz
  const queryId = currentLeagueId ?? null;

  // React Query hook'ları her render'da aynı sırada çalışmalı!
  const {
    data: league,
    status: leagueStatus,
    fetchStatus: leagueFetchStatus,
    refetch: refetchLeague
  } = useLeagueDetails(queryId);

  const {
    data: standings,
    status: standingsStatus,
    fetchStatus: standingsFetchStatus,
    refetch: refetchStandings
  } = useStandings(queryId);

  const handleRefresh = async () => {
    await Promise.all([refetchLeague(), refetchStandings()]);
  };

  // -----------------------------------------------------------------
  // 2. ADIM: KARAR MANTIĞI (Tüm return'ler hook'lardan sonra gelmeli)
  // -----------------------------------------------------------------

  // A. Sistem Meşguliyet Kontrolü
  // currentLeagueId undefined ise henüz veritabanından cevap gelmemiştir.
  const isSystemBusy = storeLoading || currentLeagueId === undefined;

  if (isSystemBusy) {
    return <FullScreenLoading message="Arena Bilgileri Kontrol Ediliyor..." />;
  }

  // B. Veri Çekme Kontrolü (ID var ama internetten veri bekleniyor)
  const isDataLoading =
    currentLeagueId !== null && (
      leagueStatus === 'pending' ||
      standingsStatus === 'pending' ||
      leagueFetchStatus === 'fetching' ||
      standingsFetchStatus === 'fetching'
    );

  if (isDataLoading) {
    return <FullScreenLoading message="Lig Verileri Alınıyor..." />;
  }

  // C. Giriş Ekranı (Lig kesinlikle yoksa)
  if (currentLeagueId === null) {
    return <EntryView />;
  }

  if (leagueStatus === 'pending') {
    return <FullScreenLoading message="Lig Detayları Alınıyor..." />;
  }

  // D. Başarı (Dashboard)
  return (
    <DashboardView
      league={league}
      standings={standings || []}
      onRefresh={handleRefresh}
    />
  );
}