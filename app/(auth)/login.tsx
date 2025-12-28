import { supabase } from '@/api/supabase';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti'; // Animasyon için
import { styled } from 'nativewind';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert("Hata", "E-posta veya şifre hatalı.");
    else router.replace('/(tabs)');
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#0b0e11]"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <StyledView className="flex-1 justify-center p-8">

          {/* LOGO BÖLÜMÜ - Animasyonlu Giriş */}
          <MotiView
            from={{ opacity: 0, scale: 0.5, translateY: -20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'spring', duration: 1000 }}
            className="items-center mb-12"
          >

            <StyledView className="w-64 h-64 items-center justify-center overflow-hidden">
              <Image
                source={require('../../assets/images/logo_main.png')}
                style={{
                  width: '100%', // Kutunun içinde biraz nefes alması için %80
                  height: '100%',
                  resizeMode: 'contain'
                }}
              />
            </StyledView>

            <StyledText className="text-gray-500 font-bold uppercase tracking-[4px] text-[10px] mt-2">
              Efsanelerin Arenası
            </StyledText>
          </MotiView>

          {/* INPUT ALANLARI - Gecikmeli (Delay) Giriş */}
          <MotiView
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ delay: 300, type: 'timing' }}
            className="space-y-4"
          >
            <StyledView className="bg-[#1a1d23] rounded-2xl border border-white/5 px-4 py-1 mb-4 focus:border-[#00ff85]/50">
              <StyledText className="text-[#00ff85] text-[10px] font-black uppercase mt-2 ml-1">E-Posta</StyledText>
              <TextInput
                placeholder="legend@leaguemaster.com"
                placeholderTextColor="#444"
                className="text-white py-3 text-base"
                onChangeText={setEmail}
                value={email}
                autoCapitalize='none'
              />
            </StyledView>

            <StyledView className="bg-[#1a1d23] rounded-2xl border border-white/5 px-4 py-1 focus:border-[#00ff85]/50">
              <StyledText className="text-[#00ff85] text-[10px] font-black uppercase mt-2 ml-1">Şifre</StyledText>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#444"
                className="text-white py-3 text-base"
                secureTextEntry
                onChangeText={setPassword}
                value={password}
                autoCapitalize='none'
              />
            </StyledView>
          </MotiView>

          {/* GİRİŞ BUTONU - Parlama Efektli */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 500, type: 'timing' }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={signInWithEmail}
              disabled={loading}
              className={`bg-[#00ff85] py-5 rounded-2xl mt-10 shadow-lg shadow-[#00ff85]/20 ${loading ? 'opacity-50' : ''}`}
            >
              <StyledText className="text-[#0b0e11] text-center font-black uppercase tracking-[2px]">
                {loading ? 'Saha Hazırlanıyor...' : 'Arenaya Gir'}
              </StyledText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/register')}
              className="mt-8"
              activeOpacity={0.7}
            >
              <StyledText className="text-gray-500 text-center font-bold">
                Yeni bir efsane misin? <StyledText className="text-[#00ff85]">Kayıt Ol</StyledText>
              </StyledText>
            </TouchableOpacity>
          </MotiView>

        </StyledView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}