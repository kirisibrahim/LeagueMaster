import { useAuthActions } from '@/hooks/useAuthActions';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { styled } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);

export default function VerifyOtpScreen() {
    const { email } = useLocalSearchParams<{ email: string }>();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const { handleVerifyOtp } = useAuthActions();
    const showNotification = useNotificationStore((state) => state.showNotification);
    const router = useRouter();

    // Kod 8 haneye ulaştığında otomatik doğrula
    useEffect(() => {
        if (code.length === 8) {
            verify();
        }
    }, [code]);

    async function verify() {
        if (code.length !== 8) return;

        setLoading(true);
        try {
            await handleVerifyOtp(email, code);
            showNotification("Arenaya giriş yapıldı!", "success");
        } catch (err: any) {
            showNotification("Kod geçersiz veya süresi dolmuş.", "error");
            setCode(''); // Hatalıysa kodu temizle
        } finally {
            setLoading(false);
        }
    }

    return (
        <StyledView className="flex-1 bg-[#0b0e11] px-8 justify-center">
            <TouchableOpacity
                onPress={() => router.back()}
                className="absolute top-16 left-8 w-10 h-10 bg-[#1a1d23] rounded-full items-center justify-center border border-white/5"
            >
                <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>

            <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="items-center mb-12"
            >
                <StyledView className="w-20 h-20 bg-[#00ff85]/10 rounded-[30px] items-center justify-center mb-6 border border-[#00ff85]/20">
                    <Ionicons name="mail-unread-outline" size={40} color="#00ff85" />
                </StyledView>

                <StyledText className="text-white text-3xl font-black italic uppercase tracking-tighter text-center">
                    KODU <StyledText className="text-[#00ff85]">ONAYLA</StyledText>
                </StyledText>

                <StyledText className="text-gray-500 text-center mt-4 font-medium leading-5">
                    <StyledText className="text-gray-300">{email}</StyledText>{"\n"}
                    adresine gönderilen 8 haneli kodu gir.
                </StyledText>
            </MotiView>

            <StyledView className="relative h-20 justify-center items-center">
                <TextInput
                    value={code}
                    onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 8))}
                    keyboardType="number-pad"
                    maxLength={8}
                    autoFocus={true}
                    className="absolute w-full h-full opacity-0 z-10"
                />

                <StyledView className="flex-row justify-between w-full">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                        <MotiView
                            key={index}
                            animate={{
                                borderColor: code.length === index ? '#00ff85' : 'rgba(255,255,255,0.05)',
                                scale: code.length === index ? 1.1 : 1,
                            }}
                            className="w-10 h-14 bg-[#1a1d23] rounded-xl border-2 items-center justify-center"
                        >
                            <StyledText className="text-white text-2xl font-black italic">
                                {code[index] || ""}
                            </StyledText>
                            {code.length === index && (
                                <MotiView
                                    from={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ loop: true, duration: 800 }}
                                    className="absolute bottom-3 w-4 h-1 bg-[#00ff85] rounded-full"
                                />
                            )}
                        </MotiView>
                    ))}
                </StyledView>
            </StyledView>

            <StyledView className="mt-12 h-10 items-center justify-center">
                {loading ? (
                    <ActivityIndicator color="#00ff85" />
                ) : (
                    <TouchableOpacity onPress={() => {/* Tekrar gönder mantığı buraya */ }}>
                        <StyledText className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                            Kod gelmedi mi? <StyledText className="text-[#00ff85]">Tekrar Gönder</StyledText>
                        </StyledText>
                    </TouchableOpacity>
                )}
            </StyledView>
        </StyledView>
    );
}