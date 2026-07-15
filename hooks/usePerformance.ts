'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';

export function usePerformance() {
  const setPerformanceMetrics = useAppStore((s) => s.setPerformanceMetrics);
  const frameCountRef = useRef(0);
  const lastFPSTimeRef = useRef(performance.now());
  const lastFrameTimeRef = useRef(performance.now());

  const tick = useCallback(() => {
    const now = performance.now();
    const frameTime = now - lastFrameTimeRef.current;
    lastFrameTimeRef.current = now;
    frameCountRef.current++;

    if (now - lastFPSTimeRef.current >= 1000) {
      const fps = frameCountRef.current;
      frameCountRef.current = 0;
      lastFPSTimeRef.current = now;

      setPerformanceMetrics({
        fps,
        frameTime: Math.round(frameTime * 100) / 100,
        gpuAvailable: typeof WebGLRenderingContext !== 'undefined',
      });
    }
  }, [setPerformanceMetrics]);

  useEffect(() => {
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [tick]);
}
