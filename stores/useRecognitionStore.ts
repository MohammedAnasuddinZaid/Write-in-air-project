import { create } from 'zustand';
import type { RecognitionResult, RecognitionHistory } from '@/lib/types';

interface RecognitionStore {
  results: RecognitionResult[];
  history: RecognitionHistory[];
  currentWord: string;
  recognizedText: string;
  isProcessing: boolean;
  confidence: number;

  addResult: (result: RecognitionResult) => void;
  addHistory: (entry: RecognitionHistory) => void;
  setCurrentWord: (word: string) => void;
  setRecognizedText: (text: string) => void;
  setIsProcessing: (processing: boolean) => void;
  setConfidence: (confidence: number) => void;
  clearResults: () => void;
  clearHistory: () => void;
  undoLast: () => void;
}

export const useRecognitionStore = create<RecognitionStore>((set) => ({
  results: [],
  history: [],
  currentWord: '',
  recognizedText: '',
  isProcessing: false,
  confidence: 0,

  addResult: (result) =>
    set((state) => ({
      results: [...state.results, result],
      currentWord: result.text,
      recognizedText: state.recognizedText
        ? `${state.recognizedText} ${result.text}`
        : result.text,
      confidence: result.confidence,
    })),

  addHistory: (entry) =>
    set((state) => ({
      history: [entry, ...state.history].slice(0, 200),
    })),

  setCurrentWord: (word) => set({ currentWord: word }),
  setRecognizedText: (text) => set({ recognizedText: text }),
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  setConfidence: (confidence) => set({ confidence }),

  clearResults: () =>
    set({
      results: [],
      currentWord: '',
      recognizedText: '',
      confidence: 0,
    }),

  clearHistory: () => set({ history: [] }),

  undoLast: () =>
    set((state) => {
      const words = state.recognizedText.split(' ');
      words.pop();
      return {
        recognizedText: words.join(' '),
        results: state.results.slice(0, -1),
        currentWord: words[words.length - 1] ?? '',
      };
    }),
}));
