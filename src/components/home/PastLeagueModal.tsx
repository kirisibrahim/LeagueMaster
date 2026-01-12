import { usePastLeagueDetails } from '@/hooks/usePastLeagueDetails';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
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
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <StyledView className="flex-1 justify-end bg-black/80">
        <TouchableOpacity 
            activeOpacity={1} 
            onPress={onClose} 
            className="absolute inset-0" 
        />
        <MotiView
          from={{ translateY: 300, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="bg-[#0b0e11] h-[85%] rounded-t-[50px] border-t-2 border-[#00ff85]/30 overflow-hidden"
        >
          <StyledView className="w-full items-center pt-3 pb-2">
            <StyledView className="w-12 h-1.5 bg-white/10 rounded-full" />
          </StyledView>

          <StyledView className="px-8 pt-4 pb-6 flex-row justify-between items-center">
            <StyledView>
              <StyledText className="text-gray-500 font-black text-[10px] uppercase tracking-[4px]">
                Geçmiş Turnuva
              </StyledText>
              <StyledText className="text-white text-3xl font-black italic tracking-tighter">
                {leagueName}
              </StyledText>
            </StyledView>
            <TouchableOpacity 
              onPress={onClose} 
              className="bg-[#1a1d23] w-12 h-12 rounded-2xl items-center justify-center border border-white/5"
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </StyledView>

          <ScrollView 
            className="px-6" 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 50 }}
          >
            {isLoading ? (
              <StyledView className="mt-20">
                <ActivityIndicator color="#00ff85" size="large" />
              </StyledView>
            ) : (
              standings?.map((row: any, index: number) => {
                const isWinner = index === 0;
                return (
                  <MotiView
                    key={row.id}
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 50 }}
                    className={`flex-row items-center p-5 rounded-[30px] mb-3 relative overflow-hidden ${
                      isWinner 
                        ? 'bg-[#f1c40f] border-2 border-white/20' 
                        : 'bg-[#1a1d23] border border-white/5'
                    }`}
                  >
                    {isWinner && (
                      <StyledView className="absolute -right-4 -top-4 opacity-20">
                         <Ionicons name="trophy" size={100} color="white" />
                      </StyledView>
                    )}

                    <StyledView className={`w-10 h-10 rounded-full items-center justify-center ${
                      isWinner ? 'bg-black/20' : 'bg-black/40'
                    }`}>
                      <StyledText className={`font-black ${isWinner ? 'text-black' : 'text-[#00ff85]'}`}>
                        {index + 1}
                      </StyledText>
                    </StyledView>

                    <StyledView className="flex-1 ml-4">
                      <StyledText className={`font-black text-sm uppercase ${isWinner ? 'text-black' : 'text-white'}`}>
                        {row.team_name}
                      </StyledText>
                      <StyledText className={`text-[10px] font-bold ${isWinner ? 'text-black/60' : 'text-gray-500'}`}>
                        @{row.profiles?.username}
                      </StyledText>
                    </StyledView>

                    <StyledView className="items-end">
                      <StyledText className={`font-black text-lg ${isWinner ? 'text-black' : 'text-white'}`}>
                        {row.points}
                      </StyledText>
                      <StyledText className={`text-[8px] font-black uppercase tracking-tighter ${isWinner ? 'text-black/50' : 'text-gray-600'}`}>
                        PUAN
                      </StyledText>
                    </StyledView>
                  </MotiView>
                );
              })
            )}
          </ScrollView>
        </MotiView>
      </StyledView>
    </Modal>
  );
};