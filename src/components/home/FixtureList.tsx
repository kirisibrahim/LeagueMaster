import { useUndoMatch } from '@/hooks/useLeagueData';
import { Match } from '@/types/database';
import { styled } from 'nativewind';
import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouch = styled(TouchableOpacity);

interface FixtureListProps {
  fixture: Match[];
  isAdmin: boolean;
}

export const FixtureList = ({ fixture, isAdmin }: FixtureListProps) => {
  const undoMatch = useUndoMatch();

  const handleUndo = (matchId: string) => {
    Alert.alert(
      "Maçı Geri Al",
      "Bu maçın skorları silinecek ve tekrar 'Sıradaki Maç' haline gelecek. Emin misin?",
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Evet, Geri Al", 
          style: "destructive", 
          onPress: () => undoMatch.mutate(matchId) 
        }
      ]
    );
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} className="mt-2">
      {fixture.map((match) => (
        <StyledView 
          key={match.id} 
          className={`flex-row items-center justify-between p-4 mb-3 rounded-[25px] border ${
            match.is_completed ? 'bg-[#1a1d23] border-white/5' : 'bg-transparent border-white/10 border-dashed'
          }`}
        >
          {/* Ev Sahibi */}
          <StyledView className="flex-1 items-end">
            <StyledText className="text-white font-bold text-[12px]" numberOfLines={1}>
              {match.home_participant?.team_name}
            </StyledText>
          </StyledView>

          {/* Skor veya VS */}
          <StyledView className="mx-4 items-center min-w-[70px]">
            {match.is_completed ? (
              <StyledView className="flex-row items-center">
                <StyledText className="text-[#00ff85] font-black text-lg tracking-tighter">
                  {match.home_score} - {match.away_score}
                </StyledText>
              </StyledView>
            ) : (
              <StyledView className="bg-white/5 px-3 py-1 rounded-full">
                <StyledText className="text-gray-500 font-black text-[10px]">VS</StyledText>
              </StyledView>
            )}
          </StyledView>

          {/* Deplasman */}
          <StyledView className="flex-1 items-start">
            <StyledText className="text-white font-bold text-[12px]" numberOfLines={1}>
              {match.away_participant?.team_name}
            </StyledText>
          </StyledView>

          {/* ADMIN: GERİ AL BUTONU */}
          {isAdmin && match.is_completed && (
            <StyledTouch 
              onPress={() => handleUndo(match.id)}
              className="ml-2 p-2 bg-red-500/10 rounded-full"
            >
              <StyledText className="text-red-500 text-[10px] font-black uppercase italic">Geri</StyledText>
            </StyledTouch>
          )}
        </StyledView>
      ))}
    </ScrollView>
  );
};