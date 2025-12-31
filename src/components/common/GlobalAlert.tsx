import { useNotificationStore } from '@/store/useNotificationStore';
import { Ionicons } from '@expo/vector-icons';
import { AnimatePresence, MotiView } from 'moti';
import { styled } from 'nativewind';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const { height } = Dimensions.get('window');

export function GlobalAlert() {
  const { message, type, isVisible, title, buttons, hideNotification } = useNotificationStore();

  const isConfirm = type === 'confirm';

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay: Sadece Onay Modalı varken arkaya karartma ekler */}
          {isConfirm && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9998 }]}
            />
          )}

          <MotiView
            from={{ 
              opacity: 0, 
              translateY: isConfirm ? 20 : -50,
              scale: isConfirm ? 0.9 : 1 
            }}
            animate={{ 
              opacity: 1, 
              translateY: isConfirm ? 0 : 0,
              scale: 1 
            }}
            exit={{ 
              opacity: 0, 
              translateY: isConfirm ? 20 : -50,
              scale: isConfirm ? 0.9 : 1 
            }}
            style={{
              position: 'absolute',
              top: isConfirm ? height / 2 - 150 : 60, // Onay ise orta, Toast ise üst
              left: 20,
              right: 20,
              zIndex: 9999,
            }}
          >
            {isConfirm ? (
              /* --- CONFIRMATION MODAL --- */
              <StyledView className="bg-[#1a1d23] p-6 rounded-[32px] border border-gray-800 shadow-2xl items-center">
                <StyledView className="w-16 h-16 bg-amber-500/10 rounded-full items-center justify-center mb-4">
                  <Ionicons name="help-circle" size={32} color="#facc15" />
                </StyledView>
                
                <StyledText className="text-white text-xl font-black italic text-center uppercase tracking-tight">
                  {title || 'Emin misin?'}
                </StyledText>
                
                <StyledText className="text-gray-400 text-center mt-2 mb-6 font-medium">
                  {message}
                </StyledText>

                <StyledView className="w-full">
                  {buttons.map((btn, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        hideNotification();
                        btn.onPress();
                      }}
                      className={`h-14 rounded-2xl items-center justify-center mb-3 shadow-sm ${
                        btn.style === 'destructive' ? 'bg-red-500' : 
                        btn.style === 'cancel' ? 'bg-gray-800' : 'bg-[#00ff85]'
                      }`}
                    >
                      <StyledText className={`font-black uppercase italic tracking-widest text-xs ${
                        btn.style === 'destructive' || btn.style === 'cancel' ? 'text-white' : 'text-black'
                      }`}>
                        {btn.text}
                      </StyledText>
                    </TouchableOpacity>
                  ))}
                </StyledView>
              </StyledView>
            ) : (
              /* --- TOAST NOTIFICATION (Mevcut yapın) --- */
              <TouchableOpacity onPress={hideNotification} activeOpacity={0.9}>
                <StyledView 
                  className={`p-4 rounded-2xl border flex-row items-center shadow-2xl ${
                    type === 'error' ? 'bg-[#1a1313] border-red-500/50' : 'bg-[#0b1a14] border-[#00ff85]/50'
                  }`}
                >
                  <Ionicons 
                    name={type === 'error' ? "alert-circle" : "checkmark-circle"} 
                    size={20} 
                    color={type === 'error' ? "#ef4444" : "#00ff85"} 
                  />
                  <StyledText className={`ml-3 font-bold text-sm flex-1 ${
                    type === 'error' ? 'text-red-500' : 'text-[#00ff85]'
                  }`}>
                    {message}
                  </StyledText>
                </StyledView>
              </TouchableOpacity>
            )}
          </MotiView>
        </>
      )}
    </AnimatePresence>
  );
}