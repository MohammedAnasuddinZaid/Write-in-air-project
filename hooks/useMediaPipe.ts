'use client';

import { useEffect, useCallback, useRef } from 'react';
import { mediapipeService } from '@/services/mediapipe';
import { useAppStore } from '@/stores/useAppStore';
import { logger } from '@/services/logger';

interface UseMediaPipeOptions {
  videoElement: HTMLVideoElement | null;
  autoStart?: boolean;
  onFrame?: () => void;
  onError?: (error: string) => void;
}

export function useMediaPipe(options: UseMediaPipeOptions) {
  const { videoElement, autoStart = true, onFrame, onError } = options;
  const setModelLoaded = useAppStore((s) => s.setModelLoaded);
  const setIsTracking = useAppStore((s) => s.setIsTracking);
  const setStatusMessage = useAppStore((s) => s.setStatusMessage);
  const addToast = useAppStore((s) => s.addToast);
  const onFrameRef = useRef(onFrame);
  const onErrorRef = useRef(onError);
  onFrameRef.current = onFrame;
  onErrorRef.current = onError;

  const initialize = useCallback(async () => {
    try {
      setStatusMessage('Loading AI model...');
      await mediapipeService.initialize();
      setModelLoaded(true);
      setStatusMessage('Model ready');

      if (videoElement) {
        mediapipeService.attachVideo(videoElement);
        mediapipeService.startDetection((landmarks) => {
          setIsTracking(landmarks !== null);
          onFrameRef.current?.();
        });
      }
      logger.info('MediaPipe initialized');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI model failed to load';
      setStatusMessage(message);
      setModelLoaded(false);
      logger.error('MediaPipe initialization failed', error);
      onErrorRef.current?.(message);
      addToast({
        type: 'warning',
        message: 'Hand tracking unavailable. Touch/mouse drawing still works.',
        duration: 5000,
      });
    }
  }, [videoElement, setModelLoaded, setIsTracking, setStatusMessage, addToast]);

  const retry = useCallback(async () => {
    mediapipeService.cleanup();
    setModelLoaded(false);
    setIsTracking(false);
    setStatusMessage('Retrying AI model...');
    await new Promise((r) => setTimeout(r, 500));
    return initialize();
  }, [initialize, setModelLoaded, setIsTracking, setStatusMessage]);

  useEffect(() => {
    if (autoStart && videoElement) {
      initialize();
    }
    return () => {
      mediapipeService.stopDetection();
    };
  }, [autoStart, videoElement, initialize]);

  const cleanup = useCallback(() => {
    mediapipeService.cleanup();
    setModelLoaded(false);
    setIsTracking(false);
  }, [setModelLoaded, setIsTracking]);

  return { initialize, cleanup, retry };
}
