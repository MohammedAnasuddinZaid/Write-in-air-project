'use client';

import { useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useCanvas } from '@/hooks/useCanvas';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

interface DrawingCanvasProps {
  className?: string;
}

export function DrawingCanvas({ className }: DrawingCanvasProps) {
  const { canvasRef, renderFrame } = useCanvas();
  const strokes = useAppStore((s) => s.strokes);
  const isWriting = useAppStore((s) => s.isWriting);
  const animFrameRef = useRef<number>(0);
  const isCelebrating = useAppStore((s) => s.isCelebrating);

  const animate = useCallback(() => {
    renderFrame();
    animFrameRef.current = requestAnimationFrame(animate);
  }, [renderFrame]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [animate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'absolute inset-0 overflow-hidden rounded-2xl',
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{
          touchAction: 'none',
          pointerEvents: isCelebrating ? 'none' : 'auto',
        }}
      />
    </motion.div>
  );
}
