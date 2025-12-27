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
  const { joinLeague, isSubmitting } = useLeagueActions();

  const handleJoin = async () => {
    const success = await joinLeague(inviteCode);
    if (success) {
      setInviteCode(''); // Kod alanını temizle
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black/80 justify-center px-6">
        <StyledView className="bg-[#1a1d23] rounded-[30px] p-8 border border-gray-800">
          <StyledView className="flex-row justify-between items-center mb-6">
            <StyledText className="text-white text-xl font-black italic">LİGE KATIL</StyledText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </StyledView>

          <StyledText className="text-gray-500 text-[10px] font-black mb-2 tracking-widest uppercase">Davet Kodu</StyledText>
          <StyledInput 
            className="bg-[#0b0e11] text-white p-5 rounded-2xl mb-6 border border-gray-800 text-center text-2xl font-black tracking-[5px]"
            placeholder="X6Y2Z9"
            placeholderTextColor="#333"
            autoCapitalize="characters"
            value={inviteCode}
            onChangeText={setInviteCode}
          />

          <TouchableOpacity 
            disabled={isSubmitting}
            onPress={handleJoin}
            className={`p-5 rounded-2xl ${isSubmitting ? 'bg-gray-800' : 'bg-[#00ff85]'}`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="black" />
            ) : (
              <StyledText className="text-black font-black text-center uppercase">Katıl</StyledText>
            )}
          </TouchableOpacity>
        </StyledView>
      </KeyboardAvoidingView>
    </Modal>
  );
}