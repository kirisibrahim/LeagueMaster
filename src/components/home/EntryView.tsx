import { styled } from 'nativewind';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import CreateLeagueModal from './CreateLeagueModal';
import JoinLeagueModal from './JoinLeagueModal';

const StyledView = styled(View);
const StyledText = styled(Text);

export const EntryView = () => {
  const [modals, setModals] = useState({ create: false, join: false });

  return (
    <StyledView className="flex-1 bg-[#0b0e11] p-6 justify-center items-center">
      <StyledText className="text-white text-4xl font-black italic mb-2 tracking-tighter">HOŞ GELDİN</StyledText>
      <StyledText className="text-gray-500 text-center mb-10 font-medium">Rekabete başlamak için bir lig seç.</StyledText>

      {/* YENİ LİG OLUŞTUR BUTONU */}
      <TouchableOpacity
        onPress={() => setModals({ ...modals, create: true })}
        className="bg-[#00ff85] py-4 w-full rounded-2xl mb-4 shadow-xl shadow-[#00ff85]/20"
      >
        <StyledText className="text-[#0b0e11] font-bold text-center uppercase tracking-widest">Yeni Lig Oluştur</StyledText>
      </TouchableOpacity>

      {/* DAVET KODUYLA KATIL BUTONU */}
      <TouchableOpacity
        onPress={() => setModals({ ...modals, join: true })}
        className="bg-transparent border border-gray-800 py-4 w-full rounded-2xl"
      >
        <StyledText className="text-gray-400 font-bold text-center uppercase tracking-widest">Davet Koduyla Katıl</StyledText>
      </TouchableOpacity>

      {/* MODALI BURADA ÇAĞIRIYORUZ */}
      <CreateLeagueModal
        visible={modals.create}
        onClose={() => setModals({ ...modals, create: false })}
      />

      <JoinLeagueModal
        visible={modals.join}
        onClose={() => setModals({ ...modals, join: false })}
      />
      
    </StyledView>
  );
};