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
  const mountedRef = useRef(true);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const setCameraReady = useAppStore((s) => s.setCameraReady);
  const setStatusMessage = useAppStore((s) => s.setStatusMessage);

  const startCamera = useCallback(async () => {
    try {
      setStatusMessage('Requesting camera access...');
      await cameraService.initialize();
      if (!mountedRef.current) {
        cameraService.cleanup();
        return;
      }
      if (videoRef.current) {
        cameraService.attachToVideo(videoRef.current);
      }
      if (!mountedRef.current) return;
      setCameraReady(true);
      setStatusMessage('Camera ready');
      logger.info('Camera started');
    } catch (error) {
      if (!mountedRef.current) return;
      const message = error instanceof Error ? error.message : 'Camera failed';
      setStatusMessage(message);
      optionsRef.current.onError?.(message);
      logger.error('Camera start failed', error);
    }
  }, [setCameraReady, setStatusMessage]);

  const stopCamera = useCallback(() => {
    cameraService.cleanup();
    setCameraReady(false);
    setStatusMessage('Camera stopped');
  }, [setCameraReady, setStatusMessage]);

  useEffect(() => {
    mountedRef.current = true;
    if (autoStart) {
      startCamera();
    }
    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, [autoStart, startCamera, stopCamera]);

  return { videoRef, startCamera, stopCamera };
}
