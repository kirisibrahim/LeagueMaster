import { useLeagueActions } from '@/hooks/useLeagueActions';
import { Ionicons } from '@expo/vector-icons';
import { styled } from 'nativewind';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledInput = styled(TextInput);

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CreateLeagueModal({ visible, onClose }: Props) {
  const [form, setForm] = useState({
    name: '',
    teamName: '',
    winPoints: '3',
    drawPoints: '1',
    lossPoints: '0',
    type: 'league',
    isDoubleRound: false
  });

  // hooktan fonksiyon ve yükleme durumunu alıyoruız
  const { createLeague, isSubmitting } = useLeagueActions();

  const updateForm = (key: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleCreate = async () => {
    // hook u çağır başarılı ise modalı kapat
    const success = await createLeague(form);
    if (success) onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/80"
      >
        <StyledView className="flex-1 justify-end">
          <StyledView className="bg-[#1a1d23] rounded-t-[40px] p-6 border-t border-gray-800" style={{ height: '85%' }}>

            {/* Header */}
            <StyledView className="flex-row justify-between items-center mb-6">
              <StyledView>
                <StyledText className="text-[#00ff85] font-black text-[10px] uppercase tracking-[2px]">ORGANİZASYON KURULUMU</StyledText>
                <StyledText className="text-white text-2xl font-black italic">LİG AYARLARI</StyledText>
              </StyledView>
              <TouchableOpacity onPress={onClose} className="bg-gray-800 p-2 rounded-full">
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </StyledView>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              {/* LİG ADI */}
              <StyledText className="text-gray-500 text-[10px] font-black mb-2 uppercase">Lig İsmi</StyledText>
              <StyledInput
                className="bg-[#0b0e11] text-white p-4 rounded-2xl mb-6 border border-gray-800 font-bold"
                placeholder="Örn: Master Premier League"
                placeholderTextColor="#444"
                value={form.name}
                onChangeText={(val) => updateForm('name', val)}
              />

              {/* TAKIM ADI */}
              <StyledText className="text-[#00ff85] text-[10px] font-black mb-2 uppercase">Bu Turnuvadaki Takımın</StyledText>
              <StyledInput
                className="bg-[#0b0e11] text-white p-4 rounded-2xl mb-6 border border-[#00ff85]/30 font-bold"
                placeholder="Örn: Real Madrid"
                placeholderTextColor="#444"
                value={form.teamName}
                onChangeText={(val) => updateForm('teamName', val)}
              />

              {/* PUANLAMA */}
              {form.type === 'league' && (
                <>
                  <StyledText className="text-gray-500 text-[10px] font-black mb-3 uppercase">Puanlama</StyledText>
                  <StyledView className="flex-row justify-between mb-6">
                    {[
                      { label: 'GAL.', key: 'winPoints' },
                      { label: 'BER.', key: 'drawPoints' },
                      { label: 'MAĞ.', key: 'lossPoints' }
                    ].map((item) => (
                      <StyledView key={item.key} className="w-[31%] bg-[#0b0e11] p-3 rounded-2xl border border-gray-800 items-center">
                        <StyledText className="text-gray-600 text-[8px] font-black mb-1">{item.label}</StyledText>
                        <StyledInput
                          className="text-white font-black text-xl text-center"
                          keyboardType="numeric"
                          value={form[item.key as keyof typeof form] as string}
                          onChangeText={(v) => updateForm(item.key as any, v)}
                        />
                      </StyledView>
                    ))}
                  </StyledView>

                  <StyledText className="text-gray-500 text-[10px] font-black mb-3 uppercase">Fikstür Formatı</StyledText>
                  <StyledView className="flex-row gap-x-3 mb-10">
                    <TouchableOpacity
                      onPress={() => updateForm('isDoubleRound', false)}
                      className={`flex-1 p-4 rounded-2xl border-2 items-center ${!form.isDoubleRound ? 'border-[#00ff85] bg-[#00ff85]/5' : 'border-gray-800 bg-[#0b0e11]'}`}
                    >
                      <StyledText className={`font-black text-[10px] ${!form.isDoubleRound ? 'text-[#00ff85]' : 'text-gray-600'}`}>TEK MAÇ</StyledText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => updateForm('isDoubleRound', true)}
                      className={`flex-1 p-4 rounded-2xl border-2 items-center ${form.isDoubleRound ? 'border-[#00ff85] bg-[#00ff85]/5' : 'border-gray-800 bg-[#0b0e11]'}`}
                    >
                      <StyledText className={`font-black text-[10px] ${form.isDoubleRound ? 'text-[#00ff85]' : 'text-gray-600'}`}>RÖVANŞLI</StyledText>
                    </TouchableOpacity>
                  </StyledView>
                </>
              )}

              {/* ACTION BUTTON */}
              <TouchableOpacity
                disabled={isSubmitting}
                onPress={handleCreate}
                className={`p-5 rounded-3xl mb-10 ${isSubmitting ? 'bg-gray-800' : 'bg-[#00ff85]'}`}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="black" />
                ) : (
                  <StyledText className="text-black font-black text-center text-lg italic uppercase">Sistemi Başlat</StyledText>
                )}
              </TouchableOpacity>
            </ScrollView>
          </StyledView>
        </StyledView>
      </KeyboardAvoidingView>
    </Modal>
  );
}