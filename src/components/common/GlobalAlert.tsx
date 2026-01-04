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
              <StyledView className="bg-[#0f1115] p-8 rounded-[40px] border border-gray-800 shadow-2xl items-center">
                <StyledView
                  className={`w-20 h-20 rounded-full items-center justify-center mb-6 shadow-lg ${title?.includes('SİL') || title?.includes('DİKKAT') ? 'bg-red-500/10' : 'bg-[#00ff85]/10'
                    }`}
                >
                  <StyledView className={`w-16 h-16 rounded-full items-center justify-center border-2 ${title?.includes('SİL') || title?.includes('DİKKAT') ? 'bg-red-500/20 border-red-500/40' : 'bg-[#00ff85]/20 border-[#00ff85]/40'
                    }`}>
                    <Ionicons
                      name={title?.includes('SİL') ? "skull" : "help-circle"}
                      size={36}
                      color={title?.includes('SİL') ? "#ef4444" : "#00ff85"}
                    />
                  </StyledView>
                </StyledView>

                <StyledText className="text-white text-2xl font-black italic text-center uppercase tracking-tighter leading-7">
                  {title}
                </StyledText>

                <StyledText className="text-gray-400 text-center mt-3 mb-8 font-medium leading-5 px-2">
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
                      activeOpacity={0.8}
                      className={`h-16 rounded-[20px] items-center justify-center mb-3 flex-row ${btn.style === 'destructive' ? 'bg-red-500' :
                          btn.style === 'cancel' ? 'bg-[#1a1d23] border border-gray-700' : 'bg-[#00ff85]'
                        }`}
                    >
                      {btn.style === 'destructive' && (
                        <Ionicons name="trash-outline" size={18} color="white" style={{ marginRight: 8 }} />
                      )}
                      <StyledText className={`font-black uppercase italic tracking-[2px] text-sm ${btn.style === 'destructive' || btn.style === 'cancel' ? 'text-white' : 'text-black'
                        }`}>
                        {btn.text}
                      </StyledText>
                    </TouchableOpacity>
                  ))}
                </StyledView>
              </StyledView>
            ) : (
              <TouchableOpacity onPress={hideNotification} activeOpacity={0.9}>
                <StyledView
                  className={`p-4 rounded-2xl border flex-row items-center shadow-2xl ${type === 'error' ? 'bg-[#1a1313] border-red-500/50' : 'bg-[#0b1a14] border-[#00ff85]/50'
                    }`}
                >
                  <Ionicons
                    name={type === 'error' ? "alert-circle" : "checkmark-circle"}
                    size={20}
                    color={type === 'error' ? "#ef4444" : "#00ff85"}
                  />
                  <StyledText className={`ml-3 font-bold text-sm flex-1 ${type === 'error' ? 'text-red-500' : 'text-[#00ff85]'
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