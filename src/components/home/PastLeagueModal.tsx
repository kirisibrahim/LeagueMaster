import { usePastLeagueDetails } from '@/hooks/usePastLeagueDetails';
import { styled } from 'nativewind';
import React from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);

interface Props {
  visible: boolean;
  onClose: () => void;
  leagueId: string | null;
  leagueName: string;
}

export const PastLeagueModal = ({ visible, onClose, leagueId, leagueName }: Props) => {
  const { data: standings, isLoading } = usePastLeagueDetails(leagueId);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <StyledView className="flex-1 bg-black/90 justify-end">
        <StyledView className="bg-[#0b0e11] h-[80%] rounded-t-[40px] border-t border-[#00ff85]/20 p-6">
          
          {/* Header */}
          <StyledView className="flex-row justify-between items-center mb-8">
            <StyledView>
              <StyledText className="text-gray-500 font-black text-[10px] uppercase tracking-widest">ARŞİV KAYDI</StyledText>
              <StyledText className="text-[#00ff85] text-2xl font-black italic">{leagueName}</StyledText>
            </StyledView>
            <TouchableOpacity onPress={onClose} className="bg-white/5 p-3 rounded-full">
              <StyledText className="text-white font-bold">Kapat</StyledText>
            </TouchableOpacity>
          </StyledView>

          <ScrollView showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <ActivityIndicator color="#00ff85" />
            ) : (
              standings?.map((row: any, index: number) => (
                <StyledView 
                  key={row.id} 
                  className={`flex-row items-center p-4 rounded-2xl mb-2 ${index === 0 ? 'bg-[#f1c40f]/10 border border-[#f1c40f]/20' : 'bg-white/5'}`}
                >
                  <StyledText className={`w-6 font-black ${index === 0 ? 'text-[#f1c40f]' : 'text-gray-600'}`}>
                    {index + 1}
                  </StyledText>
                  <StyledView className="flex-1 ml-2">
                    <StyledText className="text-white font-bold text-sm uppercase">{row.team_name}</StyledText>
                    <StyledText className="text-gray-500 text-[10px]">@{row.profiles?.username}</StyledText>
                  </StyledView>
                  <StyledView className="flex-row items-center space-x-4">
                    <StyledText className="text-gray-400 font-bold text-xs">{row.points} P</StyledText>
                    {index === 0 && <StyledText className="text-lg">🏆</StyledText>}
                  </StyledView>
                </StyledView>
              ))
            )}
          </ScrollView>
        </StyledView>
      </StyledView>
    </Modal>
  );
};