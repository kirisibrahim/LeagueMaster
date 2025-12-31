import { GlobalAlert } from '@/components/common/GlobalAlert';
import { useLeagueActions } from '@/hooks/useLeagueActions';
import { Ionicons } from '@expo/vector-icons';
import { styled } from 'nativewind';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

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

  const { createLeague, isSubmitting } = useLeagueActions();

  const updateForm = (key: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleCreate = async () => {
    const success = await createLeague(form);
    if (success) onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <StyledView className="flex-1 bg-[#0b0e11]">

        {/* Dekoratif Arka Plan Işığı (Süslü Dokunuş) */}
        <StyledView
          className="absolute -top-10 -left-10 w-40 h-40 bg-[#00ff85]/10 rounded-full"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* HEADER - Neon Etkili */}
          <StyledView className="pt-8 pb-8 px-8 flex-row justify-between items-center border-b border-white/5">
            <StyledView>
              <StyledView className="flex-row items-center mb-1">
                <Ionicons name="flash" size={12} color="#00ff85" className="mr-2" />
                <StyledText className="text-[#00ff85] font-black text-[10px] tracking-[4px] uppercase">
                  KURULUM SİHİRBAZI
                </StyledText>
              </StyledView>
              <StyledText className="text-white text-4xl font-black italic tracking-tighter uppercase">
                YENİ <StyledText className="text-[#00ff85]">LİG</StyledText>
              </StyledText>
            </StyledView>
            <TouchableOpacity
              onPress={onClose}
              className="w-14 h-14 rounded-[22px] bg-[#1c2026] border border-white/10 items-center justify-center shadow-lg"
            >
              <Ionicons name="close-outline" size={32} color="white" />
            </TouchableOpacity>
          </StyledView>

          <ScrollView
            showsVerticalScrollIndicator={false}
            className="flex-1 px-4"
            contentContainerStyle={{ paddingTop: 24, paddingBottom: 24 }}
          >
            {/* GRUP 1: KİMLİK (İkonlu & Glowlu) */}
            <StyledView className="mb-4 space-y-4">
              <StyledView>
                <StyledView className="flex-row items-center mb-2 ml-1">
                  <Ionicons name="trophy" size={16} color="#00ff85" />
                  <StyledText className="text-white/60 text-[11px] font-bold uppercase tracking-widest ml-2">LİG İSMİ</StyledText>
                </StyledView>
                <StyledView className="relative">
                  <StyledInput
                    className="bg-[#16191d] text-white pl-14 pr-4 py-4 rounded-xl border border-[#00ff85]/30 font-black text-lg italic shadow-inner"
                    placeholder="Örn: Premier Lig..."
                    placeholderTextColor="#444"
                    value={form.name}
                    onChangeText={(val) => updateForm('name', val)}
                  />
                  <StyledView className="absolute left-5 top-5">
                    <Ionicons name="create-outline" size={20} color="#00ff85" />
                  </StyledView>
                </StyledView>
              </StyledView>

              <StyledView>
                <StyledView className="flex-row items-center mb-2 ml-1">
                  <Ionicons name="shield-checkmark" size={16} color="#00ff85" />
                  <StyledText className="text-white/60 text-[11px] font-bold uppercase tracking-widest ml-2">Seçtiğin Takım</StyledText>
                </StyledView>
                <StyledView className="relative">
                  <StyledInput
                    className="bg-[#16191d] text-white pl-14 pr-4 py-4 rounded-xl border border-[#00ff85]/30 font-black text-lg italic shadow-inner"
                    placeholder="Örn: Liverpool..."
                    placeholderTextColor="#444"
                    value={form.teamName}
                    onChangeText={(val) => updateForm('teamName', val)}
                  />
                  <StyledView className="absolute left-5 top-5">
                    <Ionicons name="shirt-outline" size={20} color="#00ff85" />
                  </StyledView>
                </StyledView>
              </StyledView>
            </StyledView>

            {/* GRUP 2: OYUN KURALLARI (İnteraktif Kart) */}
            <StyledView className="mb-4 p-4 bg-[#16191d] rounded-xl border border-[#00ff85]/30 relative overflow-hidden">
              {/* Arka Plan Süsü */}
              <StyledView className="absolute -right-10 -top-10">
                <Ionicons name="settings" size={150} color="white" style={{ opacity: 0.04 }} />
              </StyledView>

              <StyledText className="text-center text-white/80 text-xl font-black uppercase tracking-[3px] mb-4">
                Lig Kuralları
              </StyledText>

              <StyledView className="flex-row justify-between mb-4">
                {[
                  { label: 'Galibiyet', key: 'winPoints', color: '#00ff85', icon: 'trending-up' },
                  { label: 'Beraberlik', key: 'drawPoints', color: '#ffbb00', icon: 'remove' },
                  { label: 'Mağlubiyet', key: 'lossPoints', color: '#ff4444', icon: 'trending-down' }
                ].map((item) => (
                  <StyledView key={item.key} className="w-[30%] items-center">
                    <StyledView className="w-10 h-10 rounded-full bg-[#0b0e11] items-center justify-center mb-1 border border-white/5">
                      <Ionicons name={item.icon as any} size={16} color={item.color} />
                    </StyledView>
                    <StyledView className="w-full bg-[#0b0e11] rounded-xl border-2 border-white/5">
                      <StyledInput
                        className="text-white font-black text-2xl text-center py-2"
                        style={{ color: item.color }}
                        keyboardType="numeric"
                        selectTextOnFocus={true} // Tıklayınca metni otomatik seçer
                        returnKeyType="done"
                        maxLength={2}
                        value={form[item.key as keyof typeof form] as string}
                        onChangeText={(v) => updateForm(item.key as any, v)}
                      />
                    </StyledView>
                    <StyledText className="text-white/50 text-[10px] font-black mt-1">{item.label}</StyledText>
                  </StyledView>
                ))}
              </StyledView>

              <StyledView className="flex-row bg-[#0b0e11] p-2 rounded-xl border border-white/5">
                {[
                  { label: 'TEK MAÇ', value: false, icon: 'arrow-forward-outline' },
                  { label: 'RÖVANŞLI', value: true, icon: 'swap-horizontal-outline' }
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.label}
                    onPress={() => updateForm('isDoubleRound', opt.value)}
                    activeOpacity={0.8}
                    className={`flex-1 py-4 rounded-xl flex-row items-center justify-center ${form.isDoubleRound === opt.value ? 'bg-[#1c2026] border border-white/10' : ''
                      }`}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={16}
                      color={form.isDoubleRound === opt.value ? '#00ff85' : '#444'}
                      className="mr-2"
                    />
                    <StyledText className={`font-black text-[10px] ml-2 ${form.isDoubleRound === opt.value ? 'text-[#00ff85]' : 'text-gray-600'
                      }`}>
                      {opt.label}
                    </StyledText>
                  </TouchableOpacity>
                ))}
              </StyledView>
            </StyledView>

            {/* ACTION BUTTON - Ultra Glow */}
            <StyledView className="shadow-[#00ff85]/40 shadow-2xl">
              <TouchableOpacity
                onPress={handleCreate}
                disabled={isSubmitting}
                activeOpacity={0.9}
                className={`p-4 rounded-xl flex-row items-center justify-center overflow-hidden ${isSubmitting ? 'bg-gray-800' : 'bg-[#00ff85]'
                  }`}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="black" />
                ) : (
                  <StyledView className="flex-row items-center">
                    <StyledText className="text-black font-black text-xl italic uppercase tracking-tighter mr-2">
                      LİGİ KUR VE LOBİYE GİT
                    </StyledText>
                    <Ionicons name="rocket" size={24} color="black" />
                  </StyledView>
                )}
              </TouchableOpacity>
            </StyledView>
          </ScrollView>
        </KeyboardAvoidingView>
        <GlobalAlert />
      </StyledView>
    </Modal>
  );
}