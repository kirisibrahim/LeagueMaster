import { create } from 'zustand';

type NotificationType = 'error' | 'success' | 'info' | 'confirm';

interface ActionButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'destructive' | 'cancel';
}

interface NotificationState {
  title: string | null;
  message: string | null;
  type: NotificationType;
  isVisible: boolean;
  buttons: ActionButton[]; // onay butonları dizisi
  
  showNotification: (message: string, type?: NotificationType) => void;
  
  showConfirm: (title: string, message: string, buttons: ActionButton[]) => void;
  
  hideNotification: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  title: null,
  message: null,
  type: 'error',
  isVisible: false,
  buttons: [],

  showNotification: (message, type = 'error') => {
    set({ 
      message, 
      type, 
      isVisible: true, 
      title: null, 
      buttons: []
    });
    
    if (type !== 'confirm') {
      setTimeout(() => {
        set((state) => (state.message === message ? { isVisible: false } : state));
      }, 4000);
    }
  },

  showConfirm: (title, message, buttons) => {
    set({
      title,
      message,
      type: 'confirm',
      isVisible: true,
      buttons, // dışardan gelen butonlar
    });
  },

  hideNotification: () => set({ isVisible: false, buttons: [] }),
}));