import { useLeagueActions } from '@/hooks/useLeagueActions';
import { Ionicons } from '@expo/vector-icons';
import { styled } from 'nativewind';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledInput = styled(TextInput);

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function JoinLeagueModal({ visible, onClose }: Props) {
  const [inviteCode, setInviteCode] = useState('');
  const [teamName, setTeamName] = useState(''); // <-- 1. Yeni state eklendi
  const { joinLeague, isSubmitting } = useLeagueActions();

  const handleJoin = async () => {
    // 2. Artık joinLeague fonksiyonuna her iki bilgiyi de gönderiyoruz
    const success = await joinLeague(inviteCode, teamName);
    if (success) {
      setInviteCode('');
      setTeamName(''); // Temizle
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1 bg-black/80 justify-center px-6"
      >
        <StyledView className="bg-[#1a1d23] rounded-[30px] p-8 border border-gray-800">
          <StyledView className="flex-row justify-between items-center mb-6">
            <StyledView>
              <StyledText className="text-white text-xl font-black italic">LİGE KATIL</StyledText>
              <StyledText className="text-[#00ff85] text-[9px] font-bold uppercase tracking-widest mt-1">Kadro Kaydı Oluştur</StyledText>
            </StyledView>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </StyledView>

          {/* DAVET KODU INPUT */}
          <StyledText className="text-gray-500 text-[10px] font-black mb-2 tracking-widest uppercase ml-1">Davet Kodu</StyledText>
          <StyledInput 
            className="bg-[#0b0e11] text-white p-5 rounded-2xl mb-5 border border-gray-800 text-center text-2xl font-black tracking-[5px]"
            placeholder="X6Y2Z9"
            placeholderTextColor="#333"
            autoCapitalize="characters"
            maxLength={6}
            value={inviteCode}
            onChangeText={setInviteCode}
          />

          {/* TAKIM ADI INPUT (Yeni Eklendi) */}
          <StyledText className="text-gray-500 text-[10px] font-black mb-2 tracking-widest uppercase ml-1">Hangi Takımla Oynayacaksın?</StyledText>
          <StyledInput 
            className="bg-[#0b0e11] text-white p-5 rounded-2xl mb-8 border border-[#00ff85]/20 font-bold italic"
            placeholder="Örn: Real Madrid, Göztepe..."
            placeholderTextColor="#333"
            value={teamName}
            onChangeText={setTeamName}
          />

          <TouchableOpacity 
            disabled={isSubmitting || !inviteCode || !teamName}
            onPress={handleJoin}
            className={`p-5 rounded-2xl shadow-xl shadow-black/40 ${isSubmitting ? 'bg-gray-800' : 'bg-[#00ff85]'}`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="black" />
            ) : (
              <StyledText className="text-black font-black text-center uppercase tracking-widest">Turnuvaya Dahil Ol</StyledText>
            )}
          </TouchableOpacity>
        </StyledView>
      </KeyboardAvoidingView>
    </Modal>
  );
}