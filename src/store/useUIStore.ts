import { create } from 'zustand';

interface UIState {
  scoreModalVisible: boolean;
  selectedMatch: any | null;
  actions: {
    openScoreModal: (match: any) => void;
    closeScoreModal: () => void;
  };
}

export const useUIStore = create<UIState>((set) => ({
  scoreModalVisible: false,
  selectedMatch: null,
  actions: {
    openScoreModal: (match) => set({ scoreModalVisible: true, selectedMatch: match }),
    closeScoreModal: () => set({ scoreModalVisible: false, selectedMatch: null }),
  },
}));