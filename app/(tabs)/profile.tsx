import { supabase } from '@/api/supabase';
import { useAuthActions } from '@/hooks/useAuthActions';
import { useQuery } from '@tanstack/react-query';
import { styled } from 'nativewind';
import React from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);

export default function ProfileScreen() {
  const { handleSignOut } = useAuthActions();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return (
    <StyledView className="flex-1 bg-[#0b0e11] justify-center">
      <ActivityIndicator color="#00ff85" />
    </StyledView>
  );

  return (
    <ScrollView contentContainerStyle={{flexGrow: 1}} className="bg-[#0b0e11]">
      <StyledView className="flex-1 p-6 items-center justify-center">
        
        {/* FIFA STİLİ OYUNCU KARTI */}
        <StyledView className="w-72 h-96 bg-[#1a1d23] rounded-3xl border-2 border-[#00ff85] p-6 shadow-2xl shadow-[#00ff85]/20">
          
          {/* Üst Kısım */}
          <StyledView className="flex-row justify-between items-start">
            <StyledView>
              <StyledText className="text-[#00ff85] text-4xl font-black italic">99</StyledText>
              <StyledText className="text-gray-400 font-bold">LEG</StyledText>
            </StyledView>
            <StyledView className="w-14 h-14 bg-[#2a2e35] rounded-full items-center justify-center border border-gray-700">
               <StyledText className="text-white text-[10px] text-center font-bold uppercase" numberOfLines={2}>
                 {profile?.favorite_team || 'Team'}
               </StyledText>
            </StyledView>
          </StyledView>

          {/* Orta Kısım */}
          <StyledView className="mt-8 items-center">
            <StyledText className="text-white text-2xl font-black uppercase italic tracking-tighter">
              {profile?.username || 'Oyuncu'}
            </StyledText>
            <StyledView className="h-[2px] w-20 bg-[#00ff85] mt-2" />
          </StyledView>

          {/* Alt Kısım: İstatistikler */}
          <StyledView className="mt-10 flex-row justify-around border-t border-gray-800 pt-6">
            <StyledView className="items-center">
              <StyledText className="text-white font-bold">0</StyledText>
              <StyledText className="text-gray-500 text-[10px] uppercase">Maç</StyledText>
            </StyledView>
            <StyledView className="items-center">
              <StyledText className="text-white font-bold">0</StyledText>
              <StyledText className="text-gray-500 text-[10px] uppercase">Gol</StyledText>
            </StyledView>
            <StyledView className="items-center">
              <StyledText className="text-white font-bold">%0</StyledText>
              <StyledText className="text-gray-500 text-[10px] uppercase">Win</StyledText>
            </StyledView>
          </StyledView>
        </StyledView>

        {/* ÇIKIŞ BUTONU */}
        <TouchableOpacity 
          onPress={handleSignOut}
          className="mt-12 border border-red-500/50 px-10 py-4 rounded-full active:bg-red-500/10"
        >
          <StyledText className="text-red-500 font-bold uppercase tracking-widest text-xs">Oturumu Güvenli Kapat</StyledText>
        </TouchableOpacity>

      </StyledView>
    </ScrollView>
  );
}