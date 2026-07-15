import { create } from 'zustand';
import type { AppState, PerformanceMetrics, ToastMessage, Stroke } from '@/lib/types';
import { generateId } from '@/lib/utils';

interface AppStore extends AppState {
  performanceMetrics: PerformanceMetrics;
  toasts: ToastMessage[];
  strokes: Stroke[];
  celebrationPhrase: string;

  setCameraReady: (ready: boolean) => void;
  setModelLoaded: (loaded: boolean) => void;
  setIsTracking: (tracking: boolean) => void;
  setIsWriting: (writing: boolean) => void;
  setIsRecognizing: (recognizing: boolean) => void;
  setIsCelebrating: (celebrating: boolean) => void;
  setCurrentText: (text: string) => void;
  setRecognizedText: (text: string) => void;
  setStatusMessage: (message: string) => void;
  setPerformanceMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  setCelebrationPhrase: (phrase: string) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  setStrokes: (strokes: Stroke[]) => void;
  addStroke: (stroke: Stroke) => void;
  clearStrokes: () => void;
  resetApp: () => void;
}

const initialAppState: AppState = {
  cameraReady: false,
  modelLoaded: false,
  isTracking: false,
  isWriting: false,
  isRecognizing: false,
  isCelebrating: false,
  currentText: '',
  recognizedText: '',
  statusMessage: 'Initializing...',
};

const initialMetrics: PerformanceMetrics = {
  fps: 0,
  frameTime: 0,
  recognitionLatency: 0,
  trackingConfidence: 0,
  gestureConfidence: 0,
  cpuUsage: 0,
  memoryUsage: 0,
  gpuAvailable: false,
};

export const useAppStore = create<AppStore>((set) => ({
  ...initialAppState,
  performanceMetrics: initialMetrics,
  toasts: [],
  strokes: [],
  celebrationPhrase: '',

  setCameraReady: (ready) => set({ cameraReady: ready }),
  setModelLoaded: (loaded) => set({ modelLoaded: loaded }),
  setIsTracking: (tracking) => set({ isTracking: tracking }),
  setIsWriting: (writing) => set({ isWriting: writing }),
  setIsRecognizing: (recognizing) => set({ isRecognizing: recognizing }),
  setIsCelebrating: (celebrating) => {
    set({ isCelebrating: celebrating });
    if (!celebrating) {
      set({ celebrationPhrase: '' });
    }
  },
  setCurrentText: (text) => set({ currentText: text }),
  setRecognizedText: (text) => set({ recognizedText: text }),
  setStatusMessage: (message) => set({ statusMessage: message }),
  setCelebrationPhrase: (phrase) => set({ celebrationPhrase: phrase }),

  setPerformanceMetrics: (metrics) =>
    set((state) => ({
      performanceMetrics: { ...state.performanceMetrics, ...metrics },
    })),

  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: generateId() }],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  setStrokes: (strokes) => set({ strokes }),
  addStroke: (stroke) =>
    set((state) => ({
      strokes: [...state.strokes, stroke],
    })),
  clearStrokes: () => set({ strokes: [] }),

  resetApp: () =>
    set({
      ...initialAppState,
      performanceMetrics: initialMetrics,
      strokes: [],
      celebrationPhrase: '',
    }),
}));
