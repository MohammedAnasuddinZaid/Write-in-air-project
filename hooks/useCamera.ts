'use client';

import { useEffect, useRef, useCallback } from 'react';
import { cameraService } from '@/services/camera';
import { useAppStore } from '@/stores/useAppStore';
import { logger } from '@/services/logger';

interface UseCameraOptions {
  autoStart?: boolean;
  onError?: (error: string) => void;
}

export function useCamera(options: UseCameraOptions = {}) {
  const { autoStart = true } = options;
  const videoRef = useRef<HTMLVideoElement>(null);
  const setCameraReady = useAppStore((s) => s.setCameraReady);
  const setStatusMessage = useAppStore((s) => s.setStatusMessage);

  const startCamera = useCallback(async () => {
    try {
      setStatusMessage('Requesting camera access...');
      await cameraService.initialize();
      if (videoRef.current) {
        cameraService.attachToVideo(videoRef.current);
      }
      setCameraReady(true);
      setStatusMessage('Camera ready');
      logger.info('Camera started');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Camera failed';
      setStatusMessage(message);
      options.onError?.(message);
      logger.error('Camera start failed', error);
    }
  }, [setCameraReady, setStatusMessage, options]);

  const stopCamera = useCallback(() => {
    cameraService.cleanup();
    setCameraReady(false);
    setStatusMessage('Camera stopped');
  }, [setCameraReady, setStatusMessage]);

  useEffect(() => {
    if (autoStart) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [autoStart, startCamera, stopCamera]);

  return { videoRef, startCamera, stopCamera };
}
