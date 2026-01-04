import { useLeagueStore } from '@/store/useLeagueStore';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { styled } from 'nativewind';
import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CreateLeagueModal from './CreateLeagueModal';
import JoinLeagueModal from './JoinLeagueModal';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

export const EntryView = () => {
  const [modals, setModals] = useState({ create: false, join: false });
  const userProfile = useLeagueStore((state) => state.userProfile);
  const insets = useSafeAreaInsets();

  return (
    <StyledView className="flex-1 bg-[#0b0e11]">
      <StyledView 
        className="flex-1 px-8"
        style={{ 
          paddingTop: insets.top + 10, 
          paddingBottom: insets.bottom + 20 
        }}
      >
    
        <StyledView className="items-center mb-6">
          <MotiView 
            from={{ opacity: 0, translateY: -10 }} 
            animate={{ opacity: 1, translateY: 0 }}
            className="bg-[#1a1d23] px-5 py-2 rounded-full border border-white/5 flex-row items-center"
          >
            <StyledView className="w-2 h-2 rounded-full bg-[#00ff85] mr-2" />
            <StyledText className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
              Oyuncu: {userProfile?.username}
            </StyledText>
          </MotiView>
        </StyledView>

        <StyledView className="flex-1 justify-center items-center">
          <MotiView 
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="mb-8"
          >
            <StyledView className="w-40 h-40 items-center justify-center relative">
               <StyledImage 
                source={require('../../../assets/images/logo_main.png')} 
                className="w-full h-full"
                resizeMode="contain"
              />
              <StyledView className="absolute w-32 h-32 bg-[#00ff85]/5 rounded-full -z-10 blur-xl" />
            </StyledView>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 300 }}
          >
            <StyledText className="text-white text-4xl font-black italic tracking-tighter text-center uppercase">
              ARENA SENİ BEKLİYOR
            </StyledText>
            <StyledText className="text-gray-500 text-center mt-3 font-medium px-6 leading-5">
              Kendi krallığını kurmak için <StyledText className="text-[#00ff85]">Yeni Lig</StyledText> oluştur veya bir davet koduyla savaşa katıl.
            </StyledText>
          </MotiView>
        </StyledView>

        <StyledView className="w-full space-y-4 mb-6">
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 500 }}
          >
            <TouchableOpacity
              onPress={() => setModals({ ...modals, create: true })}
              activeOpacity={0.9}
              className="bg-[#00ff85] py-5 rounded-[24px] flex-row items-center justify-center shadow-2xl shadow-[#00ff85]/30"
            >
              <Ionicons name="trophy" size={22} color="#0b0e11" />
              <StyledText className="text-[#0b0e11] font-black uppercase tracking-[1px] ml-3">
                Yeni Lig Oluştur
              </StyledText>
            </TouchableOpacity>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 700 }}
          >
            <TouchableOpacity
              onPress={() => setModals({ ...modals, join: true })}
              activeOpacity={0.7}
              className="bg-[#1a1d23] border border-white/5 py-5 rounded-[24px] flex-row items-center justify-center"
            >
              <Ionicons name="key-outline" size={20} color="#6b7280" />
              <StyledText className="text-gray-400 font-black uppercase tracking-[1px] ml-3">
                Davet Kodun mu Var?
              </StyledText>
            </TouchableOpacity>
          </MotiView>
        </StyledView>

        <CreateLeagueModal
          visible={modals.create}
          onClose={() => setModals({ ...modals, create: false })}
        />
        <JoinLeagueModal
          visible={modals.join}
          onClose={() => setModals({ ...modals, join: false })}
        />
      </StyledView>
    </StyledView>
  );
};