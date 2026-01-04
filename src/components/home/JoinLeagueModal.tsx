import { useLeagueActions } from '@/hooks/useLeagueActions';
import { Ionicons } from '@expo/vector-icons';
import { styled } from 'nativewind';
import React, { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import TeamPickerModal from './TeamPickerModal';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledInput = styled(TextInput);

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function JoinLeagueModal({ visible, onClose }: Props) {
  const [inviteCode, setInviteCode] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<{
    id: string;
    name: string;
    logo_url: string;
  } | null>(null);

  const [isTeamPickerVisible, setIsTeamPickerVisible] = useState(false);
  const { joinLeague, isSubmitting } = useLeagueActions();

  const handleJoin = async () => {
    if (!selectedTeam || !inviteCode) return;
    
    // 3 parametre ile gönder
    const success = await joinLeague(inviteCode, selectedTeam.name, selectedTeam.id);
    
    if (success) {
      setInviteCode('');
      setSelectedTeam(null);
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

          <StyledText className="text-gray-500 text-[10px] font-black mb-2 tracking-widest uppercase ml-1">Takımını Belirle</StyledText>
          <StyledView className="relative mb-8">
            <TouchableOpacity
              onPress={() => setIsTeamPickerVisible(true)}
              className="bg-[#16191d] flex-row items-center p-4 rounded-xl border border-[#00ff85]/30"
            >
              <StyledView className="w-10 h-10 bg-[#0b0e11] rounded-lg items-center justify-center mr-3">
                {selectedTeam?.logo_url ? (
                  <Image source={{ uri: selectedTeam.logo_url }} className="w-8 h-8" resizeMode="contain" />
                ) : (
                  <Ionicons name="shield-outline" size={20} color="#444" />
                )}
              </StyledView>

              <StyledText className="text-white font-bold flex-1">
                {selectedTeam?.name || "Takımını Seç..."}
              </StyledText>
              <Ionicons name="chevron-forward" size={20} color="#00ff85" />
            </TouchableOpacity>
          </StyledView>

          <TouchableOpacity 
            disabled={isSubmitting || !inviteCode || !selectedTeam}
            onPress={handleJoin}
            className={`p-5 rounded-2xl shadow-xl shadow-black/40 ${isSubmitting || !selectedTeam || !inviteCode ? 'bg-gray-800' : 'bg-[#00ff85]'}`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="black" />
            ) : (
              <StyledText className="text-black font-black text-center uppercase tracking-widest">Turnuvaya Dahil Ol</StyledText>
            )}
          </TouchableOpacity>
        </StyledView>

        <TeamPickerModal
          visible={isTeamPickerVisible}
          onClose={() => setIsTeamPickerVisible(false)}
          onSelect={(team) => {
            // team objesini direkt state ata
            setSelectedTeam({
              id: team.id,
              name: team.name,
              logo_url: team.logo_url
            });
            setIsTeamPickerVisible(false);
          }}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}