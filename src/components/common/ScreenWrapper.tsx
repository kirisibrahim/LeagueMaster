import { styled } from 'nativewind';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const StyledView = styled(View);

interface Props {
  children: React.ReactNode;
  bg?: string;
  withPadding?: boolean;
}

export default function ScreenWrapper({ children, bg = '#0b0e11', withPadding = false }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <StyledView
      className="flex-1"
      style={{
        backgroundColor: bg,
        paddingTop: insets.top,
        // Bu padding sayesinde Android navigasyon butonları içeriği asla kapatmaz
        paddingBottom: insets.bottom > 0 ? insets.bottom : 20,
        paddingLeft: insets.left,
        paddingRight: insets.right
      }}
    >
      {children}
    </StyledView>
  );
}