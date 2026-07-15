'use client';

import { useEffect, useCallback, useRef, type MutableRefObject } from 'react';
import { motion } from 'framer-motion';
import { useCanvas } from '@/hooks/useCanvas';
import { useAppStore } from '@/stores/useAppStore';
import type { Point } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DrawingCanvasProps {
  className?: string;
  fingerPosRef?: MutableRefObject<Point | null>;
}

export function DrawingCanvas({ className, fingerPosRef }: DrawingCanvasProps) {
  const { canvasRef, renderFrame } = useCanvas();
  const isCelebrating = useAppStore((s) => s.isCelebrating);
  const animFrameRef = useRef<number>(0);

  const animate = useCallback(() => {
    renderFrame();

    if (fingerPosRef) {
      const fp = fingerPosRef.current;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && fp) {
        ctx.save();
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(fp.x, fp.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(fp.x, fp.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.fill();
        ctx.restore();
      }
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, [renderFrame, canvasRef, fingerPosRef]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [animate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('absolute inset-0 overflow-hidden rounded-2xl', className)}
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
