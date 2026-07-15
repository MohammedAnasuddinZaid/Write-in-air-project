'use client';

import { useEffect, useCallback } from 'react';
import { gestureService } from '@/services/gesture';
import { useAppStore } from '@/stores/useAppStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { GestureType, HandLandmarks } from '@/lib/types';

export function useGesture() {
  const setIsWriting = useAppStore((s) => s.setIsWriting);
  const setIsRecognizing = useAppStore((s) => s.setIsRecognizing);
  const setStatusMessage = useAppStore((s) => s.setStatusMessage);
  const addToast = useAppStore((s) => s.addToast);
  const { settings } = useSettingsStore();

  useEffect(() => {
    gestureService.updateConfig(settings.gestures);
  }, [settings.gestures]);

  const processLandmarks = useCallback(
    (landmarks: HandLandmarks) => {
      const result = gestureService.detectGesture(landmarks);
      return result;
    },
    [],
  );

  const onGesture = useCallback(
    (gesture: GestureType, callback: () => void) => {
      gestureService.onGesture(gesture, callback);
      return () => gestureService.offGesture(gesture);
    },
    [],
  );

  const setupDefaultGestures = useCallback(
    (callbacks: {
      onStartWriting?: () => void;
      onStopWriting?: () => void;
      onClear?: () => void;
      onUndo?: () => void;
      onScreenshot?: () => void;
      onToggleUI?: () => void;
      onReset?: () => void;
      onPauseRecognition?: () => void;
    }) => {
      gestureService.onGesture('pinch', () => {
        callbacks.onStartWriting?.();
        setIsWriting(true);
      });

      const offClear = onGesture('open_palm', () => {
        callbacks.onClear?.();
        addToast({ type: 'info', message: 'Canvas cleared', duration: 2000 });
      });

      const offUndo = onGesture('thumb_up', () => {
        callbacks.onUndo?.();
        addToast({ type: 'info', message: 'Undo', duration: 1500 });
      });

      const offPeace = onGesture('peace', () => {
        callbacks.onPauseRecognition?.();
        const current = useAppStore.getState().isRecognizing;
        setIsRecognizing(!current);
        addToast({ type: 'info', message: 'Recognition toggled', duration: 1500 });
      });

      const offThree = onGesture('three_fingers', () => {
        callbacks.onScreenshot?.();
        addToast({ type: 'success', message: 'Screenshot saved', duration: 2000 });
      });

      const offFour = onGesture('four_fingers', () => {
        callbacks.onToggleUI?.();
      });

      const offFive = onGesture('five_fingers', () => {
        callbacks.onReset?.();
        addToast({ type: 'info', message: 'Reset complete', duration: 2000 });
      });

      return () => {
        offClear?.();
        offUndo?.();
        offPeace?.();
        offThree?.();
        offFour?.();
        offFive?.();
      };
    },
    [setIsWriting, setIsRecognizing, addToast, onGesture],
  );

  return { processLandmarks, onGesture, setupDefaultGestures };
}
