import { supabase } from '@/api/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
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
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const leagueId = league?.id;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!leagueId) return;
    fetchParticipants();

    // KATILIMCI VE STATÜ DEĞİŞİKLİĞİNİ DİNLE
    const channel = supabase
      .channel(`lobby-${leagueId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'league_participants',
        filter: `league_id=eq.${leagueId}`
      }, () => fetchParticipants())
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'leagues',
        filter: `id=eq.${leagueId}`
      }, (payload) => {
        // STATÜ aktif olduysa dashboard yenile
        if (payload.new.status === 'active') {
          onRefresh();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [leagueId]);

  const fetchParticipants = async () => {
    const { data: users } = await supabase
      .from('league_participants')
      .select('*')
      .eq('league_id', leagueId);
    setParticipants(users || []);
  };

  const handleStartEngine = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('start_league_engine', {
        p_league_id: leagueId
      });

      if (error) throw error;

      // react query ye yenileme emri
      await queryClient.invalidateQueries({ queryKey: ['league_details'] });
      await queryClient.invalidateQueries({ queryKey: ['nextMatch'] });
      await queryClient.invalidateQueries({ queryKey: ['standings'] });
      await queryClient.invalidateQueries({ queryKey: ['fullFixture'] });

      // 3. onrefreshi yine de çağır
      onRefresh();

    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Lig başlatılamadı.');
    } finally {
      setLoading(false);
    }
  };

  const startLeague = () => {
    if (participants.length < 2) {
      return Alert.alert('Hata', 'Ligi başlatmak için en az 2 katılımcı gereklidir.');
    }

    Alert.alert(
      'Ligi Başlat',
      'Fikstür oluşturulacak ve lig aktif hale gelecek. Onaylıyor musun?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'BAŞLAT', onPress: () => handleStartEngine() }
      ]
    );
  };

  const onShareInvite = async () => {
    try {
      await Share.share({
        message: `Ligimize katıl! Davet Kodun: ${league?.invite_code}\nUygulamayı indir ve rekabete ortak ol!`,
      });
    } catch (error) { console.error(error); }
  };

  return (
    <StyledView className="flex-1 p-6 bg-[#0b0e11]">
      {/* Üst Bilgi Kartı */}
      <StyledView className="bg-[#1a1d23] p-6 rounded-[30px] border border-gray-800 mb-6">
        <StyledText className="text-gray-500 font-bold uppercase text-[10px] mb-1">Davet Kodu</StyledText>
        <TouchableOpacity onPress={onShareInvite} className="flex-row justify-between items-center">
          <StyledText className="text-[#00ff85] text-4xl font-black italic tracking-tighter">
            {league?.invite_code || '---'}
          </StyledText>
          <Ionicons name="share-outline" size={24} color="#00ff85" />
        </TouchableOpacity>
      </StyledView>

      {/* Katılımcı Listesi */}
      <StyledView className="flex-1">
        <StyledText className="text-white font-black italic mb-4 uppercase">
          HAZIR OLANLAR <StyledText className="text-gray-600">({participants.length})</StyledText>
        </StyledText>

        <FlatList
          data={participants}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <StyledView className="flex-row items-center bg-[#1a1d23] p-4 rounded-2xl mb-3 border border-gray-900">
              <StyledText className="text-[#00ff85] font-black mr-4 w-4">{index + 1}.</StyledText>
              <StyledView className="flex-1">
                <StyledText className="text-white font-bold">{item.team_name}</StyledText>
                <StyledText className="text-gray-500 text-xs">Katıldı</StyledText>
              </StyledView>
              <Ionicons name="checkmark-circle" size={20} color="#00ff85" />
            </StyledView>
          )}
        />
      </StyledView>

      {/* Admin Butonu */}
      {isAdmin && (
        <TouchableOpacity
          onPress={startLeague}
          disabled={loading}
          className={`bg-[#00ff85] p-5 rounded-2xl shadow-lg shadow-[#00ff85]/30 mb-4 ${loading ? 'opacity-50' : ''}`}
        >
          {loading ? (
            <ActivityIndicator color="black" />
          ) : (
            <StyledText className="text-black font-black text-center uppercase">LİGİ BAŞLAT VE FİKSTÜRÜ OLUŞTUR</StyledText>
          )}
        </TouchableOpacity>
      )}
    </StyledView>
  );
}