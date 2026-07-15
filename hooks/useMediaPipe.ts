'use client';

import { useEffect, useCallback, useRef } from 'react';
import { mediapipeService } from '@/services/mediapipe';
import { useAppStore } from '@/stores/useAppStore';
import { logger } from '@/services/logger';

interface UseMediaPipeOptions {
  videoElement: HTMLVideoElement | null;
  autoStart?: boolean;
  onFrame?: () => void;
}

export function useMediaPipe(options: UseMediaPipeOptions) {
  const { videoElement, autoStart = true, onFrame } = options;
  const setModelLoaded = useAppStore((s) => s.setModelLoaded);
  const setIsTracking = useAppStore((s) => s.setIsTracking);
  const setStatusMessage = useAppStore((s) => s.setStatusMessage);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

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
      setStatusMessage('AI model failed to load');
      logger.error('MediaPipe initialization failed', error);
    }
  }, [videoElement, setModelLoaded, setIsTracking, setStatusMessage]);

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

  return { initialize, cleanup };
}
