import { supabase } from '@/api/supabase';
import TeamPickerModal from '@/components/home/TeamPickerModal';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { styled } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Keyboard, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<{ id: string, name: string, logo_url: string } | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const router = useRouter();
  const showNotification = useNotificationStore((state) => state.showNotification);

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
    if (!email.trim() || !password.trim() || !username.trim() || !selectedTeam) {
      showNotification("Lütfen tüm alanları doldur ve favori takımını seç!", "error");
      return;
    }

    setLoading(true);

    try {
      // Auth Kaydı, Kullanıcıyı oluşturuyoruz
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: 'leaguemaster://',
          data: {
            username: username.trim(),
            // Buraya metadata olarak ekliyoruz ki auth seviyesinde de tutulsun
            favorite_team: selectedTeam.name,
            favorite_team_id: selectedTeam.id
          }
        }
      });

      if (authError) throw authError;

      // profil tablosu güncelleme 
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            username: username.trim(),
            favorite_team: selectedTeam.name,
            favorite_team_id: selectedTeam.id,
            updated_at: new Date(),
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error("Profil update hatası:", profileError.message);
        }
      }

      showNotification("Hoş geldin şampiyon! E-postanı doğrulamayı unutma.", "success");
      router.replace('/(auth)/login');

    } catch (err: any) {
      showNotification(err.message || "Kayıt sırasında bir hata oluştu.", "error");
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
            paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : 40
          }}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <StyledView className="flex-1 justify-center p-8">
            <MotiView
              from={{ opacity: 0, translateY: -20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 800 }}
              className="mb-10"
            >
              <StyledView className="flex-row items-center">
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

            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 200 }}
            >
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

              <StyledView className="bg-[#1a1d23] rounded-2xl border border-white/5 p-4 mb-4">
                <StyledView className="flex-row items-center mb-3">
                  <StyledView className="w-1 h-3 bg-[#00ff85] rounded-full mr-2" />
                  <StyledText className="text-[#00ff85] text-[10px] font-black uppercase tracking-widest">
                    Favori Takım
                  </StyledText>
                </StyledView>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsModalVisible(true)}
                  className={selectedTeam
                    ? "flex-row items-center justify-between p-3 rounded-xl border border-[#00ff85]/20 bg-[#00ff85]/5"
                    : "flex-row items-center justify-between p-3 rounded-xl border border-white/5 bg-[#0b0e11]/50"
                  }
                >
                  <StyledView className="flex-row items-center flex-1">
                    {selectedTeam ? (
                      <React.Fragment>
                        <StyledView className="bg-white/10 p-1.5 rounded-full mr-3 border border-white/10">
                          <StyledImage
                            source={{ uri: selectedTeam.logo_url }}
                            className="w-7 h-7"
                            resizeMode="contain"
                          />
                        </StyledView>
                        <StyledText className="text-white text-base font-bold italic">
                          {selectedTeam.name}
                        </StyledText>
                      </React.Fragment>
                    ) : (
                      <StyledView className="flex-row items-center">
                        <StyledView className="w-10 h-10 bg-[#1a1d23] rounded-full items-center justify-center border border-dashed border-gray-700 mr-3">
                          <StyledText className="text-gray-600 text-lg">?</StyledText>
                        </StyledView>
                        <StyledText className="text-gray-500 text-sm font-medium">
                          Arenadaki tarafını seç...
                        </StyledText>
                      </StyledView>
                    )}
                  </StyledView>

                  <StyledView className="bg-[#00ff85]/10 px-3 py-1.5 rounded-lg border border-[#00ff85]/20">
                    <StyledText className="text-[#00ff85] text-[10px] font-black uppercase tracking-tighter">
                      {selectedTeam ? 'DEĞİŞTİR' : 'GÖZAT'}
                    </StyledText>
                  </StyledView>
                </TouchableOpacity>
              </StyledView>

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

            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 400 }}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={signUp}
                disabled={loading}
                className={`bg-[#00ff85] py-5 rounded-2xl mt-6 shadow-lg shadow-[#00ff85]/20 flex-row justify-center items-center ${loading ? 'opacity-50' : ''}`}
              >
                {loading && <ActivityIndicator color="#0b0e11" style={{ marginRight: 10 }} />}
                <StyledText className="text-[#0b0e11] text-center font-black uppercase tracking-[2px]">
                  {loading ? 'Kadro Kuruluyor...' : 'Arenaya Kaydol'}
                </StyledText>
              </TouchableOpacity>

              <StyledView className="flex-row items-center justify-center mt-8 mb-6">
                <StyledText className="text-gray-500 font-bold">
                  Zaten bir efsane misin?
                </StyledText>

                <TouchableOpacity
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                  className="ml-3 bg-[#00ff85]/10 border border-[#00ff85]/30 px-4 py-2 rounded-xl"
                >
                  <StyledText className="text-[#00ff85] font-black uppercase text-xs tracking-widest">
                    Giriş Yap
                  </StyledText>
                </TouchableOpacity>
              </StyledView>
            </MotiView>

          </StyledView>
        </ScrollView>
      </TouchableWithoutFeedback>

      <TeamPickerModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSelect={(team) => {
          setSelectedTeam(team);
        }}
      />
    </StyledView>
  );
}