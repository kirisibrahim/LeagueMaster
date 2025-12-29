import { useNotificationStore } from '@/store/useNotificationStore';
import { Ionicons } from '@expo/vector-icons'; // İkon eklemek profesyonel durur
import { AnimatePresence, MotiView } from 'moti';
import { styled } from 'nativewind';
import { Text, TouchableOpacity, View } from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);

export function GlobalAlert() {
  const { message, type, isVisible, hideNotification } = useNotificationStore();

  return (
    <AnimatePresence>
      {isVisible && (
        <MotiView
          from={{ opacity: 0, translateY: -50 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -50 }}
          style={{
            position: 'absolute',
            top: 60, // Safe area'ya göre ayarlanabilir
            left: 20,
            right: 20,
            zIndex: 9999,
          }}
        >
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
        </MotiView>
      )}
    </AnimatePresence>
  );
}