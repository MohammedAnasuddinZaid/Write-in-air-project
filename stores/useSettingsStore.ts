import { create } from 'zustand';
import type { Settings } from '@/lib/types';
import { defaultSettings } from '@/lib/config';

interface SettingsStore {
  settings: Settings;
  isOpen: boolean;
  setSettings: (settings: Settings) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: { ...defaultSettings },
  isOpen: false,

  setSettings: (settings) => set({ settings }),
  updateSettings: (partial) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
    })),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (open) => set({ isOpen: open }),
  resetSettings: () => set({ settings: { ...defaultSettings } }),
}));
