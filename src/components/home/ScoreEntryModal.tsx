import { styled } from 'nativewind';
import React, { useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledInput = styled(TextInput);
const StyledTouch = styled(TouchableOpacity);

interface Props {
  visible: boolean;
  onClose: () => void;
  nextMatch: any;
  onSave: (homeScore: number, awayScore: number, motmId: string | null) => void;
}

export const ScoreEntryModal = ({ visible, onClose, nextMatch, onSave }: Props) => {
  const [homeScore, setHomeScore] = useState('0');
  const [awayScore, setAwayScore] = useState('0');
  // Maçın adamı state
  const [selectedMotm, setSelectedMotm] = useState<string | null>(null);

  const handleSave = () => {
    onSave(parseInt(homeScore), parseInt(awayScore), selectedMotm);
    onClose();
    // resetle
    setHomeScore('0');
    setAwayScore('0');
    setSelectedMotm(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <StyledView className="flex-1 justify-end bg-black/80">
        <StyledView className="bg-[#1a1d23] p-8 rounded-t-[40px] border-t border-white/10">
          <StyledText className="text-white/40 text-center font-black uppercase tracking-[3px] mb-6">Skor Girişi</StyledText>
          
          <StyledView className="flex-row justify-between items-center mb-10">
            {/* Home Input */}
            <StyledView className="items-center flex-1">
              <StyledText className="text-white font-bold mb-2 text-[10px] uppercase opacity-60 text-center">
                {nextMatch?.home_participant?.team_name}
              </StyledText>
              <StyledInput 
                value={homeScore}
                onChangeText={setHomeScore}
                keyboardType="numeric"
                className="bg-[#0b0e11] w-20 h-20 rounded-3xl text-[#00ff85] text-3xl font-black text-center border border-[#00ff85]/20"
              />
            </StyledView>

            <StyledText className="text-white/20 text-4xl font-black italic mx-4">-</StyledText>

            {/* Away Input */}
            <StyledView className="items-center flex-1">
              <StyledText className="text-white font-bold mb-2 text-[10px] uppercase opacity-60 text-center">
                {nextMatch?.away_participant?.team_name}
              </StyledText>
              <StyledInput 
                value={awayScore}
                onChangeText={setAwayScore}
                keyboardType="numeric"
                className="bg-[#0b0e11] w-20 h-20 rounded-3xl text-white text-3xl font-black text-center border border-white/10"
              />
            </StyledView>
          </StyledView>

          {/* MOTM Seçim Alanı */}
          <StyledView className="mb-8">
            <StyledText className="text-white/40 text-center font-bold uppercase tracking-widest text-[10px] mb-4">Maçın Adamı (MOTM)</StyledText>
            <StyledView className="flex-row justify-between">
              
              {/* Home Player Card */}
              <StyledTouch 
                onPress={() => setSelectedMotm(nextMatch?.home_user_id)}
                className={`flex-1 p-4 rounded-2xl border ${selectedMotm === nextMatch?.home_user_id ? 'bg-[#00ff85]/10 border-[#00ff85]' : 'bg-[#0b0e11] border-white/5'} mr-2 items-center`}
              >
                <StyledText className={`font-bold text-xs ${selectedMotm === nextMatch?.home_user_id ? 'text-[#00ff85]' : 'text-white/60'}`}>
                  {nextMatch?.home_participant?.team_name}
                </StyledText>
              </StyledTouch>

              {/* Away Player Card */}
              <StyledTouch 
                onPress={() => setSelectedMotm(nextMatch?.away_user_id)}
                className={`flex-1 p-4 rounded-2xl border ${selectedMotm === nextMatch?.away_user_id ? 'bg-[#00ff85]/10 border-[#00ff85]' : 'bg-[#0b0e11] border-white/5'} ml-2 items-center`}
              >
                <StyledText className={`font-bold text-xs ${selectedMotm === nextMatch?.away_user_id ? 'text-[#00ff85]' : 'text-white/60'}`}>
                  {nextMatch?.away_participant?.team_name}
                </StyledText>
              </StyledTouch>

            </StyledView>
          </StyledView>

          <StyledTouch 
            onPress={handleSave} 
            disabled={!selectedMotm} // MOTM seçilmeden kaydı zorunlu kılıyoruz
            className={`py-5 rounded-2xl items-center shadow-xl ${!selectedMotm ? 'bg-gray-700 opacity-50' : 'bg-[#00ff85] shadow-[#00ff85]/20'}`}
          >
            <StyledText className="text-black font-black uppercase italic tracking-widest">Maçı Onayla ve Kaydet</StyledText>
          </StyledTouch>

          <StyledTouch onPress={onClose} className="mt-4 items-center">
            <StyledText className="text-gray-500 font-bold uppercase text-[10px]">Vazgeç</StyledText>
          </StyledTouch>
        </StyledView>
      </StyledView>
    </Modal>
  );
};