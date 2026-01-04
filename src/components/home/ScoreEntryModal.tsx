import { useUIStore } from '@/store/useUIStore';
import { Ionicons } from '@expo/vector-icons';
import { styled } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { Image, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledInput = styled(TextInput);
const StyledTouch = styled(TouchableOpacity);
const StyledImage = styled(Image);

interface Props {
  visible: boolean;
  onClose: () => void;
  nextMatch: any;
  onSave: (homeScore: number, awayScore: number, motmId: string | null) => void;
}


const ScoreStepper = ({ value, onChange, color = "#00ff85" }: any) => (
  <StyledView className="flex-row items-center justify-between bg-[#0b0e11] w-[130px] rounded-full p-1 border border-white/10">
    <StyledTouch
      onPress={() => onChange(Math.max(0, parseInt(value) - 1).toString())}
      className="w-10 h-10 items-center justify-center bg-white/5 rounded-full"
    >
      <Ionicons name="remove" size={20} color="white" />
    </StyledTouch>

    <StyledView className="flex-1 items-center">
      <StyledText className="text-3xl font-[1000] italic leading-none" style={{ color }}>
        {value}
      </StyledText>
    </StyledView>

    <StyledTouch
      onPress={() => onChange((parseInt(value) + 1).toString())}
      className="w-10 h-10 items-center justify-center bg-white/5 rounded-full"
    >
      <Ionicons name="add" size={20} color="white" />
    </StyledTouch>
  </StyledView>
);

export const ScoreEntryModal = ({ visible, onClose, nextMatch, onSave }: Props) => {
  const modalMode = useUIStore((state) => state.modalMode);

  const [homeScore, setHomeScore] = useState('0');
  const [awayScore, setAwayScore] = useState('0');
  const [selectedMotm, setSelectedMotm] = useState<string | null>(null);

  // modal açıldığında mevcut skorları inputlara doldur
  useEffect(() => {
    if (visible && nextMatch) {
      setHomeScore(String(nextMatch.home_score || 0));
      setAwayScore(String(nextMatch.away_score || 0));
      setSelectedMotm(nextMatch.motm_user_id || null);
    }
  }, [visible, nextMatch]);

  const handleSave = async () => {
    try {
      // onsave nin tamamlanamasını bekle
      await onSave(parseInt(homeScore) || 0, parseInt(awayScore) || 0, selectedMotm);
      onClose();
      // state temizliği
      setHomeScore('0');
      setAwayScore('0');
      setSelectedMotm(null);
    } catch (error: any) {
      console.error("Veri Yazma Hatası:", error);
      alert("Bağlantı Sorunu: Veri kaydedilemedi. Hata: " + (error.message || "Bilinmiyor"));
    }
  };

  // maç bitirilecekse motm zorunlu
  const isSaveDisabled = modalMode === 'finish' && !selectedMotm;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <StyledView className="flex-1 justify-end bg-black/90">
        <StyledTouch activeOpacity={1} onPress={onClose} className="flex-1" />

        <StyledView className="bg-[#1a1d23] p-4 rounded-t-3xl border-t border-[#00ff85]/20">

          <StyledView className="items-center mb-10">
            <StyledView className={`flex-row items-center px-5 py-2 rounded-full ${modalMode === 'live' ? 'bg-[#00ff85]/10' : 'bg-red-500/10'}`}>
              <Ionicons
                name={modalMode === 'live' ? "pulse" : "megaphone"}
                size={16}
                color={modalMode === 'live' ? "#00ff85" : "#ef4444"}
              />
              <StyledText className={`font-black text-[12px] tracking-[2px] ml-2 ${modalMode === 'live' ? 'text-[#00ff85]' : 'text-red-500'}`}>
                {modalMode === 'live' ? 'CANLI YAYIN' : 'SON DÜDÜK'}
              </StyledText>
            </StyledView>

            <StyledText className="text-white/20 text-[10px] mt-2 font-bold uppercase tracking-widest">
              {modalMode === 'live' ? 'Skorlar anlık tabloya yansır' : 'Maç resmen sonuçlandırılacak'}
            </StyledText>
          </StyledView>

          <StyledView className="flex-row items-start justify-between mb-6">
            <StyledView className="items-center flex-1">
              <StyledView className="w-20 h-20 bg-[#0b0e11] rounded-[24px] items-center justify-center border border-white/5 mb-3 overflow-hidden shadow-2xl">
                {nextMatch?.home_participant?.official_teams?.logo_url ? (
                  <StyledImage
                    source={{ uri: nextMatch.home_participant.official_teams.logo_url }}
                    className="w-14 h-14"
                    resizeMode="contain"
                  />
                ) : (
                  <StyledText className="text-white/20 text-3xl font-[1000] italic">
                    {nextMatch?.home_participant?.team_name?.[0]?.toUpperCase() || '?'}
                  </StyledText>
                )}
              </StyledView>
              <StyledText numberOfLines={1} className="text-white font-black text-[10px] uppercase italic text-center w-28 mb-6 tracking-widest">
                {nextMatch?.home_participant?.team_name}
              </StyledText>
              <ScoreStepper value={homeScore} onChange={setHomeScore} color="#00ff85" />
            </StyledView>

            <StyledView className="w-12 items-center">
              <StyledView className="h-20 justify-center">
                <Ionicons name="shield-half" size={24} color="#0CE558" />
              </StyledView>
            </StyledView>

            <StyledView className="items-center flex-1">
              <StyledView className="w-20 h-20 bg-[#0b0e11] rounded-[24px] items-center justify-center border border-white/5 mb-3 overflow-hidden shadow-2xl">
                {nextMatch?.away_participant?.official_teams?.logo_url ? (
                  <StyledImage
                    source={{ uri: nextMatch.away_participant.official_teams.logo_url }}
                    className="w-14 h-14"
                    resizeMode="contain"
                  />
                ) : (
                  <StyledText className="text-white/20 text-3xl font-[1000] italic">
                    {nextMatch?.away_participant?.team_name?.[0]?.toUpperCase() || '?'}
                  </StyledText>
                )}
              </StyledView>
              <StyledText numberOfLines={1} className="text-white font-black text-[10px] uppercase italic text-center w-28 mb-6 tracking-widest">
                {nextMatch?.away_participant?.team_name}
              </StyledText>
              <ScoreStepper value={awayScore} onChange={setAwayScore} color="#fff" />
            </StyledView>
          </StyledView>

          {modalMode === 'finish' && (
            <StyledView className="mb-8 bg-[#0b0e11] p-6 rounded-[32px] border border-red-500/20 shadow-2xl">
              <StyledView className="flex-row items-center justify-center mb-4">
                <Ionicons name="star" size={14} color="#00ff85" />
                <StyledText className="text-white/40 font-bold uppercase tracking-widest text-[10px] ml-2">
                  MAÇIN ADAMI (ZORUNLU)
                </StyledText>
              </StyledView>

              <StyledView className="flex-row gap-x-3">
                {[
                  { id: nextMatch?.home_user_id, name: nextMatch?.home_participant?.team_name, logo: nextMatch?.home_participant?.official_teams?.logo_url },
                  { id: nextMatch?.away_user_id, name: nextMatch?.away_participant?.team_name, logo: nextMatch?.away_participant?.official_teams?.logo_url }
                ].map((team) => (
                  <StyledTouch
                    key={team.id}
                    onPress={() => setSelectedMotm(team.id)}
                    className={`flex-1 py-4 rounded-2xl border-2 items-center justify-center ${selectedMotm === team.id
                      ? 'bg-[#00ff85]/10 border-[#00ff85]'
                      : 'bg-white/5 border-transparent'
                      }`}
                  >
                    <StyledText className={`font-black text-[11px] uppercase ${selectedMotm === team.id ? 'text-[#00ff85]' : 'text-white/30'}`}>
                      {team.name}
                    </StyledText>
                  </StyledTouch>
                ))}
              </StyledView>
            </StyledView>
          )}
          <StyledTouch
            onPress={handleSave}
            disabled={isSaveDisabled}
            className={`py-4 rounded-2xl flex-row items-center justify-center shadow-2xl active:scale-[0.98] ${isSaveDisabled ? 'bg-white/5' : 'bg-[#00ff85] shadow-[#00ff85]/30'
              }`}
          >
            {!isSaveDisabled && (
              <Ionicons
                name={modalMode === 'live' ? "flash" : "notifications"}
                size={18}
                color="black"
                style={{ marginRight: 8, marginBottom: 2 }}
              />
            )}
            <StyledText className={`font-black uppercase italic tracking-widest ${isSaveDisabled ? 'text-white/10' : 'text-black'}`}>
              {modalMode === 'live' ? 'SKORU GÜNCELLE' : 'RESMEN BİTİR'}
            </StyledText>
          </StyledTouch>

          <StyledTouch
            onPress={onClose}
            className="mt-2 py-4 rounded-2xl flex-row items-center justify-center border border-white/10 bg-white/5 active:scale-[0.98] active:bg-white/10"
          >
            <Ionicons
              name="close-circle-outline"
              size={16}
              color="rgba(255,255,255,0.6)"
              style={{ marginRight: 8 }}
            />
            <StyledText className="text-white/60 font-black uppercase tracking-[3px] text-[11px] italic">
              VAZGEÇ VE KAPAT
            </StyledText>
          </StyledTouch>
        </StyledView>
      </StyledView>
    </Modal>
  );
};