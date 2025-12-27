import { supabase } from '@/api/supabase';
import { useRouter } from 'expo-router';
import { styled } from 'nativewind';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [favTeam, setFavTeam] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

async function signUp() {
  if (!email || !password || !username) {
    Alert.alert("Hata", "Lütfen tüm alanları doldur!");
    return;
  }

  setLoading(true);
  
  // Auth kaydı ve ek verileri gönderme
  const { data, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
        favorite_team: favTeam,
      }
    }
  });

  if (authError) {
    Alert.alert("Kayıt Hatası", authError.message);
  } else {
    Alert.alert("Onay Gerekli", "E-postana bir doğrulama linki gönderdik. Lütfen kontrol et!");
    router.replace('/(auth)/login');
  }
  setLoading(false);
}

  return (
    <ScrollView className="flex-1 bg-[#0b0e11]">
      <StyledView className="p-6 justify-center mt-20">
        <StyledView className="mb-10">
          <StyledText className="text-[#00ff85] text-4xl font-black italic">KATIL</StyledText>
          <StyledText className="text-gray-400">Ligin yeni yıldızı sen ol.</StyledText>
        </StyledView>

        <StyledView className="space-y-4">
          <TextInput
            placeholder="Kullanıcı Adı"
            placeholderTextColor="#666"
            className="bg-[#1a1d23] text-white p-4 rounded-xl border border-gray-800"
            onChangeText={setUsername}
            value={username}
          />
          <TextInput
            placeholder="E-posta"
            placeholderTextColor="#666"
            className="bg-[#1a1d23] text-white p-4 rounded-xl border border-gray-800 mt-4"
            onChangeText={setEmail}
            value={email}
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Favori FIFA Takımın (Örn: Real Madrid)"
            placeholderTextColor="#666"
            className="bg-[#1a1d23] text-white p-4 rounded-xl border border-gray-800 mt-4"
            onChangeText={setFavTeam}
            value={favTeam}
          />
          <TextInput
            placeholder="Şifre"
            placeholderTextColor="#666"
            className="bg-[#1a1d23] text-white p-4 rounded-xl border border-gray-800 mt-4"
            secureTextEntry
            onChangeText={setPassword}
            value={password}
          />
        </StyledView>

        <TouchableOpacity 
          className={`bg-[#00ff85] py-4 rounded-xl mt-8 ${loading ? 'opacity-50' : ''}`}
          onPress={signUp}
          disabled={loading}
        >
          <StyledText className="text-[#0b0e11] text-center font-bold uppercase">
            {loading ? 'Kayıt Yapılıyor...' : 'Hesap Oluştur'}
          </StyledText>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} className="mt-6">
          <StyledText className="text-gray-400 text-center">
            Zaten hesabın var mı? <StyledText className="text-[#00ff85]">Giriş Yap</StyledText>
          </StyledText>
        </TouchableOpacity>
      </StyledView>
    </ScrollView>
  );
}