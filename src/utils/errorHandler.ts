import { Alert } from 'react-native';

export const handleAppError = (error: any, context: string) => {
  console.error(`[${context}] Error:`, error);
  
  const message = error.message || "Beklenmedik bir hata oluştu.";
  
  Alert.alert(
    "Bir Sorun Oluştu",
    `${message}\n\nLütfen tekrar deneyin veya desteğe başvurun.`,
    [{ text: "Tamam" }]
  );
};