'use client';

import { useRef, useCallback, useEffect } from 'react';
import { drawingService } from '@/services/drawing';
import { useAppStore } from '@/stores/useAppStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { Point, BrushConfig } from '@/lib/types';
import { getCanvasContext } from '@/lib/utils';

export function useCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const setIsWriting = useAppStore((s) => s.setIsWriting);
  const { settings } = useSettingsStore();

  const initialize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getCanvasContext(canvas) as CanvasRenderingContext2D;
    if (!ctx) return;
    ctxRef.current = ctx;
    canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
    canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    drawingService.setCanvasSize(window.innerWidth, window.innerHeight);
  }, []);

  const renderFrame = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingService.renderAllStrokes(ctx);
    drawingService.renderCurrentStroke(ctx);
  }, []);

  const beginStroke = useCallback(
    (point: Point, brushOverride?: BrushConfig) => {
      drawingService.beginStroke(point, brushOverride ?? settings.brush);
      setIsWriting(true);
    },
    [settings.brush, setIsWriting],
  );

  const continueStroke = useCallback(
    (point: Point, brushOverride?: BrushConfig) => {
      drawingService.continueStroke(point, brushOverride ?? settings.brush);
      renderFrame();
    },
    [settings.brush, renderFrame],
  );

  const endStroke = useCallback(() => {
    const stroke = drawingService.endStroke();
    setIsWriting(false);
    return stroke;
  }, [setIsWriting]);

  const clearCanvas = useCallback(() => {
    drawingService.clear();
    renderFrame();
  }, [renderFrame]);

  const undo = useCallback(() => {
    drawingService.undo();
    renderFrame();
  }, [renderFrame]);

  const redo = useCallback(() => {
    drawingService.redo();
    renderFrame();
  }, [renderFrame]);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
    canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
    const ctx = getCanvasContext(canvas) as CanvasRenderingContext2D;
    if (ctx) {
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    }
    drawingService.setCanvasSize(window.innerWidth, window.innerHeight);
    renderFrame();
  }, [renderFrame]);

  useEffect(() => {
    initialize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [initialize, resize]);

  return {
    canvasRef,
    ctxRef,
    beginStroke,
    continueStroke,
    endStroke,
    renderFrame,
    clearCanvas,
    undo,
    redo,
    resize,
  };
}
