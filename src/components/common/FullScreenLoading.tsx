import { styled } from 'nativewind';
import { ActivityIndicator, Text, View } from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);

export const FullScreenLoading = ({ message = "Yükleniyor..." }: { message?: string }) => (
  <StyledView className="flex-1 bg-[#0b0e11] justify-center items-center">
    <ActivityIndicator color="#00ff85" size="large" />
    <StyledText className="text-gray-500 mt-4 font-mono text-[10px] uppercase tracking-widest">
      {message}
    </StyledText>
  </StyledView>
);