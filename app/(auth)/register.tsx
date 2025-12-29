import { supabase } from '@/api/supabase';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { styled } from 'nativewind';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [favTeam, setFavTeam] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const router = useRouter();
  const showNotification = useNotificationStore((state) => state.showNotification);

  // Klavye yönetimi - Login ile aynı standart
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  async function signUp() {
    if (!email || !password || !username) {
      showNotification("Lütfen tüm zorunlu alanları doldur!", "error");
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // BURASI EKLEDİĞİMİZ KRİTİK SATIR:
        // 'leaguemaster://' senin app.json'da belirlediğin scheme olmalı.
        // Yanına eklediğimiz 'confirm' ise app/_layout'ta yakalayacağımız path.
        emailRedirectTo: 'leaguemaster://',
        data: {
          username: username,
          favorite_team: favTeam,
        }
      }
    });

    if (authError) {
      showNotification(authError.message, "error");
    } else {
      showNotification("E-postana doğrulama linki gönderdik. Arenaya girmek için onaylamayı unutma!", "success");
      router.replace('/(auth)/login');
    }
    setLoading(false);
  }

  return (
    <StyledView className="flex-1 bg-[#0b0e11]">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : 40
          }}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <StyledView className="flex-1 justify-center p-8">

            {/* ÜST BAŞLIK - Neon Estetik */}
            <MotiView
              from={{ opacity: 0, translateY: -20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 800 }}
              className="mb-10"
            >
              <StyledView className="flex-row items-center">
                {/* StyledImage kullanarak hatayı gideriyoruz */}
                <StyledImage
                  source={require('../../assets/images/logo_main.png')}
                  className="w-24 h-24 mr-4"
                  resizeMode="contain"
                />

                <StyledView className="w-1 h-12 bg-[#00ff85] mr-4 rounded-full" />

                <StyledView>
                  <StyledText className="text-[#00ff85] text-4xl font-black italic tracking-tighter">KATIL</StyledText>
                  <StyledText className="text-gray-500 font-bold uppercase text-[10px] tracking-[2px]">
                    Ligin yeni yıldızı sen ol
                  </StyledText>
                </StyledView>
              </StyledView>
            </MotiView>

            {/* FORM ALANI - Gecikmeli Giriş */}
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 200 }}
              className="space-y-4"
            >
              {/* Kullanıcı Adı */}
              <StyledView className="bg-[#1a1d23] rounded-2xl border border-white/5 px-4 py-1 mb-4">
                <StyledText className="text-[#00ff85] text-[10px] font-black uppercase mt-2 ml-1">Kullanıcı Adı</StyledText>
                <TextInput
                  placeholder="legend_striker"
                  placeholderTextColor="#444"
                  className="text-white py-3 text-base"
                  onChangeText={setUsername}
                  value={username}
                />
              </StyledView>

              {/* E-posta */}
              <StyledView className="bg-[#1a1d23] rounded-2xl border border-white/5 px-4 py-1 mb-4">
                <StyledText className="text-[#00ff85] text-[10px] font-black uppercase mt-2 ml-1">E-Posta</StyledText>
                <TextInput
                  placeholder="legend@leaguemaster.com"
                  placeholderTextColor="#444"
                  className="text-white py-3 text-base"
                  onChangeText={setEmail}
                  value={email}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </StyledView>

              {/* Favori Takım */}
              <StyledView className="bg-[#1a1d23] rounded-2xl border border-white/5 px-4 py-1 mb-4">
                <StyledText className="text-[#00ff85] text-[10px] font-black uppercase mt-2 ml-1">Favori Takım</StyledText>
                <TextInput
                  placeholder="Real Madrid"
                  placeholderTextColor="#444"
                  className="text-white py-3 text-base"
                  onChangeText={setFavTeam}
                  value={favTeam}
                />
              </StyledView>

              {/* Şifre */}
              <StyledView className="bg-[#1a1d23] rounded-2xl border border-white/5 px-4 py-1 mb-4">
                <StyledText className="text-[#00ff85] text-[10px] font-black uppercase mt-2 ml-1">Şifre</StyledText>
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#444"
                  className="text-white py-3 text-base"
                  secureTextEntry
                  onChangeText={setPassword}
                  value={password}
                />
              </StyledView>
            </MotiView>

            {/* AKSİYON BUTONLARI */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 400 }}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={signUp}
                disabled={loading}
                className={`bg-[#00ff85] py-5 rounded-2xl mt-6 shadow-lg shadow-[#00ff85]/20 ${loading ? 'opacity-50' : ''}`}
              >
                <StyledText className="text-[#0b0e11] text-center font-black uppercase tracking-[2px]">
                  {loading ? 'Kadro Kuruluyor...' : 'Arenaya Kaydol'}
                </StyledText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.back()}
                className="mt-6"
                activeOpacity={0.7}
              >
                <StyledText className="text-gray-500 text-center font-bold">
                  Zaten bir efsane misin? <StyledText className="text-[#00ff85]">Giriş Yap</StyledText>
                </StyledText>
              </TouchableOpacity>
            </MotiView>

          </StyledView>
        </ScrollView>
      </TouchableWithoutFeedback>
    </StyledView>
  );
}