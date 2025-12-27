import { supabase } from '@/api/supabase';
import { useRouter } from 'expo-router';
import { styled } from 'nativewind';
import React, { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

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

    if (error) Alert.alert("Hata", error.message);
    else router.replace('/(tabs)'); // giriş başarılı anasayfaya git
    setLoading(false);
  }

  return (
    <StyledView className="flex-1 bg-[#0b0e11] justify-center p-6">
      <StyledView className="mb-10">
        <StyledText className="text-[#00ff85] text-4xl font-black italic">LEAGUE MASTER</StyledText>
        <StyledText className="text-gray-400">Vadiye değil, sahalara hükmet.</StyledText>
      </StyledView>

      <StyledView className="space-y-4">
        <TextInput
          placeholder="E-posta"
          placeholderTextColor="#666"
          className="bg-[#1a1d23] text-white p-4 rounded-xl border border-gray-800"
          onChangeText={(text) => setEmail(text)}
          value={email}
          autoCapitalize={'none'}
        />
        <TextInput
          placeholder="Şifre"
          placeholderTextColor="#666"
          className="bg-[#1a1d23] text-white p-4 rounded-xl border border-gray-800 mt-4"
          secureTextEntry={true}
          onChangeText={(text) => setPassword(text)}
          value={password}
          autoCapitalize={'none'}
        />
      </StyledView>

      <TouchableOpacity 
        className={`bg-[#00ff85] py-4 rounded-xl mt-8 ${loading ? 'opacity-50' : ''}`}
        onPress={signInWithEmail}
        disabled={loading}
      >
        <StyledText className="text-[#0b0e11] text-center font-bold uppercase tracking-widest">
          {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
        </StyledText>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/register')} className="mt-6">
        <StyledText className="text-gray-400 text-center">
          Hesabın yok mu? <StyledText className="text-[#00ff85]">Kayıt Ol</StyledText>
        </StyledText>
      </TouchableOpacity>
    </StyledView>
  );
}