'use client';

import { useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useCanvas } from '@/hooks/useCanvas';
import { useAppStore } from '@/stores/useAppStore';
import type { Point } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DrawingCanvasProps {
  className?: string;
  fingerPosition?: Point | null;
}

export function DrawingCanvas({ className, fingerPosition }: DrawingCanvasProps) {
  const { canvasRef, renderFrame } = useCanvas();
  const strokes = useAppStore((s) => s.strokes);
  const isWriting = useAppStore((s) => s.isWriting);
  const animFrameRef = useRef<number>(0);
  const isCelebrating = useAppStore((s) => s.isCelebrating);
  const fingerPosRef = useRef<Point | null>(null);
  fingerPosRef.current = fingerPosition ?? null;

  const animate = useCallback(() => {
    renderFrame();
    const ctx = canvasRef.current?.getContext('2d');
    const fp = fingerPosRef.current;
    if (ctx && fp) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(fp.x, fp.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(fp.x, fp.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
      ctx.fill();
      ctx.restore();
    }
    animFrameRef.current = requestAnimationFrame(animate);
  }, [renderFrame, canvasRef]);

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
