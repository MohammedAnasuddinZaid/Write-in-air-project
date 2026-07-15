'use client';

import { useCallback, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';

export function useFPS() {
  const setPerformanceMetrics = useAppStore((s) => s.setPerformanceMetrics);
  const frameCount = useRef(0);
  const lastCheck = useRef(performance.now());

  const tick = useCallback(() => {
    frameCount.current++;
    const now = performance.now();
    if (now - lastCheck.current >= 1000) {
      setPerformanceMetrics({ fps: frameCount.current });
      frameCount.current = 0;
      lastCheck.current = now;
    }
  }, [setPerformanceMetrics]);

  return { tick };
}
