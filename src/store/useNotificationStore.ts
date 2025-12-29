import { create } from 'zustand';

type NotificationType = 'error' | 'success' | 'info';

interface NotificationState {
  message: string | null;
  type: NotificationType;
  isVisible: boolean;
  showNotification: (message: string, type?: NotificationType) => void;
  hideNotification: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  message: null,
  type: 'error',
  isVisible: false,
  showNotification: (message, type = 'error') => {
    set({ message, type, isVisible: true });
    // 4 saniye sonra otomatik kapat
    setTimeout(() => {
      set({ isVisible: false });
    }, 4000);
  },
  hideNotification: () => set({ isVisible: false }),
}));