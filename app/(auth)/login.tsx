import { supabase } from '@/api/supabase';
import { useLeagueStore } from '@/store/useLeagueStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { styled } from 'nativewind';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const router = useRouter();
  const showNotification = useNotificationStore((state) => state.showNotification);

  useEffect(() => {
    // klavye dinleyicileri
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

  async function signInWithEmail() {
    if (!email.trim() || !password.trim()) {
      showNotification("E-posta ve şifre girmelisin.", "error");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        showNotification("E-posta veya şifre hatalı.", "error");
      } else if (data.user) {
        // useLeagueStore içindeki fetchProfile fonksiyonunu çağırıyoruz
        await useLeagueStore.getState().fetchProfile(data.user.id);

        showNotification("Hoş geldin efsane! Giriş başarılı.", "success");
        router.replace('/(tabs)');
      }
    } catch (err) {
      showNotification("Bağlantı hatası oluştu.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <StyledView className="flex-1 bg-[#0b0e11]">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: keyboardHeight
          }}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <StyledView className="flex-1 justify-center p-8">

            {/* LOGO BÖLÜMÜ */}
            <MotiView
              from={{ opacity: 0, scale: 0.5, translateY: -20 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ type: 'spring', duration: 1000 }}
              className="items-center mb-12"
            >
              <StyledView className="w-56 h-56 items-center justify-center">
                <Image
                  source={require('../../assets/images/logo_main.png')}
                  style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                />
              </StyledView>
              <StyledText className="text-gray-500 font-bold uppercase tracking-[4px] text-[10px] mt-2 text-center">
                Efsanelerin Arenası
              </StyledText>
            </MotiView>

            {/* INPUT ALANLARI */}
            <MotiView
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: 300, type: 'timing' }}
            >
              <StyledView className="bg-[#1a1d23] rounded-2xl border border-white/5 px-4 py-1 mb-4">
                <StyledText className="text-[#00ff85] text-[10px] font-black uppercase mt-2 ml-1">E-Posta</StyledText>
                <TextInput
                  placeholder="legend@leaguemaster.com"
                  placeholderTextColor="#444"
                  className="text-white py-3 text-base"
                  onChangeText={setEmail}
                  value={email}
                  autoCapitalize='none'
                  keyboardType="email-address"
                />
              </StyledView>

              <StyledView className="bg-[#1a1d23] rounded-2xl border border-white/5 px-4 py-1">
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

            {/* BUTONLAR */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 500, type: 'timing' }}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={signInWithEmail}
                disabled={loading}
                className={`bg-[#00ff85] py-5 rounded-2xl mt-10 shadow-lg shadow-[#00ff85]/20 flex-row justify-center items-center ${loading ? 'opacity-50' : ''}`}
              >
                {loading && <ActivityIndicator color="#0b0e11" style={{ marginRight: 10 }} />}
                <StyledText className="text-[#0b0e11] text-center font-black uppercase tracking-[2px]">
                  {loading ? 'Saha Hazırlanıyor...' : 'Arenaya Gir'}
                </StyledText>
              </TouchableOpacity>

              <StyledView className="flex-row items-center justify-center mt-10 mb-6">
                <StyledText className="text-gray-500 font-bold">
                  Henüz bir hesabın yok mu?
                </StyledText>

                <TouchableOpacity
                  onPress={() => router.push('/(auth)/register')}
                  activeOpacity={0.7}
                  className="ml-3 bg-[#00ff85]/10 border border-[#00ff85]/30 px-4 py-2 rounded-xl"
                >
                  <StyledText className="text-[#00ff85] font-black uppercase text-xs tracking-widest">
                    Kayıt Ol
                  </StyledText>
                </TouchableOpacity>
              </StyledView>
            </MotiView>

          </StyledView>
        </ScrollView>
      </TouchableWithoutFeedback>
    </StyledView>
  );
}