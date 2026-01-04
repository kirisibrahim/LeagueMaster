import { create } from 'zustand';

interface UIState {
  scoreModalVisible: boolean;
  selectedMatch: any | null;
  modalMode: 'live' | 'finish'; // canlı mı bitmiş mi
  actions: {
    openScoreModal: (match: any, mode: 'live' | 'finish') => void;
    closeScoreModal: () => void;
  };
}

export const useUIStore = create<UIState>((set) => ({
  scoreModalVisible: false,
  selectedMatch: null,
  modalMode: 'live', 
  actions: {
    openScoreModal: (match, mode) => 
      set({ 
        scoreModalVisible: true, 
        selectedMatch: match, 
        modalMode: mode // gelen modu kaydet
      }),
    closeScoreModal: () => 
      set({ 
        scoreModalVisible: false, 
        selectedMatch: null 
      }),
  },
}));