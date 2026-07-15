'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Undo2, Redo2, Trash2, Camera, Pen, Hand, Download,
  RefreshCw, AlertTriangle, CameraOff,
} from 'lucide-react';
import { CameraFeed } from '@/components/canvas/CameraFeed';
import { DrawingCanvas } from '@/components/canvas/DrawingCanvas';
import { BirthdayCelebration } from '@/components/animations/BirthdayCelebration';
import { ParticleEngine } from '@/components/animations/ParticleEngine';
import { Header } from '@/components/layout/Header';
import { ToastContainer } from '@/components/ui/Toast';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { useMediaPipe } from '@/hooks/useMediaPipe';
import { useCanvas } from '@/hooks/useCanvas';
import { useGesture } from '@/hooks/useGesture';
import { usePerformance } from '@/hooks/usePerformance';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useAppStore } from '@/stores/useAppStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useRecognitionStore } from '@/stores/useRecognitionStore';
import { recognitionService } from '@/services/recognition';
import { drawingService } from '@/services/drawing';
import { gestureService } from '@/services/gesture';
import { audioService } from '@/services/audio';
import { exportService } from '@/services/export';
import { mediapipeService } from '@/services/mediapipe';
import type { Point, HandLandmarks } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
}

export default function HomePage() {
  const [videoReady, setVideoReady] = useState<HTMLVideoElement | null>(null);
  const [showUI, setShowUI] = useState(true);
  const [initTimedOut, setInitTimedOut] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [fingerPosition, setFingerPosition] = useState<Point | null>(null);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);

  const { canvasRef, beginStroke, continueStroke, endStroke, clearCanvas, undo, redo, renderFrame } = useCanvas();
  const { processLandmarks, setupDefaultGestures } = useGesture();
  usePerformance();

  const cameraReady = useAppStore((s) => s.cameraReady);
  const modelLoaded = useAppStore((s) => s.modelLoaded);
  const isTracking = useAppStore((s) => s.isTracking);
  const isCelebrating = useAppStore((s) => s.isCelebrating);
  const setCameraReady = useAppStore((s) => s.setCameraReady);
  const setModelLoaded = useAppStore((s) => s.setModelLoaded);
  const setStatusMessage = useAppStore((s) => s.setStatusMessage);
  const addToast = useAppStore((s) => s.addToast);
  const setIsCelebrating = useAppStore((s) => s.setIsCelebrating);
  const setCelebrationPhrase = useAppStore((s) => s.setCelebrationPhrase);
  const performanceMetrics = useAppStore((s) => s.performanceMetrics);
  const strokes = useAppStore((s) => s.strokes);

  const recognizedText = useRecognitionStore((s) => s.recognizedText);
  const currentWord = useRecognitionStore((s) => s.currentWord);
  const addResult = useRecognitionStore((s) => s.addResult);
  const setRecognizedText = useRecognitionStore((s) => s.setRecognizedText);

  const isWritingRef = useRef(false);
  const isGestureWritingRef = useRef(false);
  const emojiIdRef = useRef(0);

  const canvasActionsRef = useRef({ beginStroke, continueStroke, endStroke });
  canvasActionsRef.current = { beginStroke, continueStroke, endStroke };

  const spawnEmojis = useCallback((emoji: string, count: number) => {
    const newEmojis: FloatingEmoji[] = [];
    for (let i = 0; i < count; i++) {
      emojiIdRef.current++;
      newEmojis.push({
        id: emojiIdRef.current,
        emoji,
        x: 10 + Math.random() * 80,
        y: 60 + Math.random() * 30,
      });
    }
    setFloatingEmojis((prev) => [...prev, ...newEmojis]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => !newEmojis.find((n) => n.id === e.id)));
    }, 3000);
  }, []);

  useMediaPipe({
    videoElement: videoReady,
    autoStart: true,
    onLandmarks: useCallback((landmarks: HandLandmarks | null) => {
      if (!landmarks) {
        setFingerPosition(null);
        if (isGestureWritingRef.current) {
          const stroke = canvasActionsRef.current.endStroke();
          if (stroke) {
            recognitionService.addStroke(stroke);
          }
          isGestureWritingRef.current = false;
        }
        return;
      }

      const tip = mediapipeService.getFingerTipPosition(landmarks, true);
      if (!tip) return;

      const screenPoint: Point = {
        x: tip.x * window.innerWidth,
        y: tip.y * window.innerHeight,
        pressure: tip.pressure ?? 0.5,
      };

      setFingerPosition(screenPoint);

      const isPinching = mediapipeService.isPinchGesture(landmarks);
      if (isPinching) {
        if (!isGestureWritingRef.current) {
          canvasActionsRef.current.beginStroke(screenPoint);
          isGestureWritingRef.current = true;
        } else {
          canvasActionsRef.current.continueStroke(screenPoint);
        }
      } else if (isGestureWritingRef.current) {
        const stroke = canvasActionsRef.current.endStroke();
        if (stroke) {
          recognitionService.addStroke(stroke);
        }
        isGestureWritingRef.current = false;
      }
    }, []),
    onError: (err) => setModelError(err),
  });

  useEffect(() => {
    if (cameraReady && modelLoaded) {
      setInitTimedOut(false);
      return;
    }
    const timer = setTimeout(() => {
      if (!modelLoaded) {
        setInitTimedOut(true);
        setStatusMessage('Camera or AI model loading timed out');
        addToast({
          type: 'warning',
          message: 'Loading timed out. Touch/mouse input still works.',
          duration: 6000,
        });
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [cameraReady, modelLoaded, setStatusMessage, addToast]);

  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoReady || !cameraReady) return;
    setStatusMessage('AI model loading...');
  }, [videoReady, cameraReady, setStatusMessage]);

  const onVideoReady = useCallback((video: HTMLVideoElement) => {
    setVideoReady(video);
  }, []);

  const handleCameraError = useCallback((err: string) => {
    setCameraError(err);
    setCameraReady(false);
    addToast({ type: 'error', message: `Camera error: ${err}`, duration: 5000 });
  }, [setCameraReady, addToast]);

  const handleRetryCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);
    setModelError(null);
    setInitTimedOut(false);
    setStatusMessage('Restarting...');
    mediapipeService.cleanup();
    audioService.playClick();
    window.location.reload();
  }, [setCameraReady, setStatusMessage]);

  const handleStartWriting = useCallback(() => {
    isWritingRef.current = true;
  }, []);

  const handleStopWriting = useCallback(() => {
    if (isWritingRef.current) {
      const stroke = endStroke();
      if (stroke) {
        recognitionService.addStroke(stroke);
      }
      isWritingRef.current = false;
    }
  }, [endStroke]);

  const handleClear = useCallback(() => {
    clearCanvas();
    drawingService.clear();
    audioService.playClick();
  }, [clearCanvas]);

  const handleUndo = useCallback(() => {
    undo();
    const removed = drawingService.undo();
    if (removed) audioService.playClick();
  }, [undo]);

  const handleRedo = useCallback(() => {
    redo();
    const restored = drawingService.redo();
    if (restored) audioService.playClick();
  }, [redo]);

  const handleScreenshot = useCallback(() => {
    exportService.downloadAsPNG('airwriter-drawing.png');
    addToast({ type: 'success', message: 'Screenshot saved!', duration: 2000 });
  }, [addToast]);

  const handleReset = useCallback(() => {
    clearCanvas();
    drawingService.clear();
    setRecognizedText('');
    recognitionService.clear();
    setStatusMessage('Reset complete');
    addToast({ type: 'info', message: 'Reset complete', duration: 1500 });
  }, [clearCanvas, setRecognizedText, setStatusMessage, addToast]);

  const handleToggleUI = useCallback(() => {
    setShowUI((prev) => !prev);
  }, []);

  useEffect(() => {
    const cleanup = setupDefaultGestures({
      onStartWriting: handleStartWriting,
      onStopWriting: handleStopWriting,
      onClear: handleClear,
      onUndo: handleUndo,
      onScreenshot: handleScreenshot,
      onToggleUI: handleToggleUI,
      onReset: handleReset,
      onPauseRecognition: () => {},
    });
    return cleanup;
  }, [
    setupDefaultGestures,
    handleStartWriting, handleStopWriting,
    handleClear, handleUndo, handleScreenshot,
    handleToggleUI, handleReset,
  ]);

  useEffect(() => {
    recognitionService.onRecognition((text) => {
      setRecognizedText(text);
    });
    recognitionService.onCelebration((phrase) => {
      setCelebrationPhrase(phrase);
      setIsCelebrating(true);
      addToast({ type: 'success', message: `🎉 ${phrase}!`, duration: 4000 });

      const upper = phrase.toUpperCase();
      if (upper.includes('HAPPY')) {
        spawnEmojis('😊', 8);
      }
      if (upper.includes('BIRTHDAY')) {
        spawnEmojis('🎂', 6);
        setTimeout(() => spawnEmojis('🎉', 10), 500);
        setTimeout(() => spawnEmojis('🎈', 8), 1000);
      }
      if (upper.includes('RAMADAN')) {
        spawnEmojis('🌙', 8);
      }
      if (upper.includes('NEW YEAR')) {
        spawnEmojis('🎆', 10);
      }
      if (upper.includes('CONGRATULATIONS') || upper.includes('WELCOME')) {
        spawnEmojis('🎉', 8);
      }
    });
  }, [setIsCelebrating, setCelebrationPhrase, addToast, spawnEmojis, setRecognizedText]);

  useKeyboard([
    { key: 'z', ctrl: true, handler: handleUndo },
    { key: 'y', ctrl: true, handler: handleRedo },
    { key: 'c', ctrl: true, shift: true, handler: handleClear },
    { key: 's', ctrl: true, handler: handleScreenshot },
    { key: 'h', ctrl: true, handler: handleToggleUI },
    { key: 'Escape', handler: () => setIsCelebrating(false) },
  ]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      if (x >= 0 && y >= 0 && x <= window.innerWidth && y <= window.innerHeight) {
        beginStroke({ x, y, pressure: 0.5 });
      }
    },
    [beginStroke],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      if (isWritingRef.current) {
        continueStroke({ x, y, pressure: 0.5 });
      }
    },
    [continueStroke],
  );

  const handleTouchEnd = useCallback(() => {
    handleStopWriting();
  }, [handleStopWriting]);

  const showSplash = !cameraReady || (!modelLoaded && !cameraError && !modelError && !initTimedOut);
  const showFallback = (!cameraReady && cameraError) || initTimedOut || modelError;

  return (
    <main className="relative flex h-screen w-screen flex-col overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#1a0a2e] dark:from-[#0a0a0f] dark:via-[#12121a] dark:to-[#1a0a2e] light:from-[#f0f4ff] light:via-[#f8fafc] light:to-[#f0f0ff]" />
      <div
        className="absolute inset-0 opacity-30 dark:opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(168, 85, 247, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)',
        }}
      />

      {/* Splash screen */}
      <AnimatePresence>
        {showSplash && !showFallback && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f]"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex flex-col items-center gap-6"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-2xl shadow-primary-500/30">
                <Pen className="h-10 w-10 text-white" />
              </div>
              <h1 className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-3xl font-bold text-transparent">
                AirWriter AI
              </h1>
              <p className="text-sm text-white/40">Write in the air. Celebrate beautifully.</p>
              <motion.div
                className="flex items-center gap-2 text-sm text-white/30"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="h-2 w-2 animate-pulse rounded-full bg-primary-400" />
                Loading AI model...
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating emoji celebration */}
      <AnimatePresence>
        {floatingEmojis.map((fe) => (
          <motion.div
            key={fe.id}
            initial={{ opacity: 1, y: 0, x: `${fe.x}vw`, scale: 0.5 }}
            animate={{ opacity: 0, y: -200, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, ease: 'easeOut' }}
            className="pointer-events-none fixed z-40 text-4xl"
            style={{ left: `${fe.x}vw`, top: `${fe.y}vh` }}
          >
            {fe.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Error / Fallback screen */}
      <AnimatePresence>
        {showFallback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f]/90 backdrop-blur-sm"
          >
            <GlassPanel blur="xl" opacity="heavy" className="flex max-w-md flex-col items-center gap-6 px-10 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/20">
                <AlertTriangle className="h-8 w-8 text-yellow-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Camera Required</h2>
              <p className="text-sm leading-relaxed text-white/60">
                {cameraError
                  ? `Camera error: ${cameraError}`
                  : modelError
                    ? `AI model unavailable: ${modelError}`
                    : 'Camera access or AI model loading timed out.'}
                <br />
                Touch and mouse drawing still works without the camera.
              </p>
              <div className="flex gap-3">
                <Button variant="primary" onClick={handleRetryCamera} icon={<RefreshCw className="h-4 w-4" />}>
                  Retry
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCameraReady(true);
                    setInitTimedOut(false);
                    setModelError(null);
                    setCameraError(null);
                    setStatusMessage('Camera skipped — touch/mouse mode');
                    addToast({ type: 'info', message: 'Using touch/mouse mode. Camera tracking disabled.', duration: 3000 });
                  }}
                >
                  Continue Without Camera
                </Button>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera feed */}
      <div className="absolute right-4 top-16 z-20 sm:right-6 sm:top-20">
        <CameraFeed onVideoReady={onVideoReady} onError={handleCameraError} />
      </div>

      {/* Writing area */}
      <div
        className="absolute inset-0 z-10"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <DrawingCanvas fingerPosition={fingerPosition} />
      </div>

      {/* Recognition overlay */}
      {recognizedText && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-24 left-1/2 z-20 -translate-x-1/2"
        >
          <GlassPanel blur="xl" opacity="heavy" className="px-6 py-3">
            <p className="text-center text-lg font-semibold text-white drop-shadow-lg">
              {recognizedText}
              {currentWord && !recognizedText.endsWith(currentWord) && (
                <span className="text-white/40"> | {currentWord}</span>
              )}
            </p>
          </GlassPanel>
        </motion.div>
      )}

      {/* Writing indicator */}
      {isWritingRef.current && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="h-4 w-4 animate-pulse rounded-full bg-primary-400/50 shadow-lg shadow-primary-400/30" />
        </motion.div>
      )}

      {/* Bottom toolbar */}
      <AnimatePresence>
        {showUI && !showFallback && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2"
          >
            <GlassPanel blur="xl" opacity="heavy" className="flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-5">
              <IconButton icon={<Undo2 className="h-4 w-4" />} label="Undo (Ctrl+Z)" size="sm" onClick={handleUndo} />
              <IconButton icon={<Redo2 className="h-4 w-4" />} label="Redo (Ctrl+Y)" size="sm" onClick={handleRedo} />
              <div className="mx-1 h-6 w-px bg-white/10" />
              <IconButton icon={<Trash2 className="h-4 w-4" />} label="Clear (Ctrl+Shift+C)" size="sm" onClick={handleClear} />
              <IconButton icon={<Camera className="h-4 w-4" />} label="Screenshot (Ctrl+S)" size="sm" onClick={handleScreenshot} />
              <IconButton icon={<Download className="h-4 w-4" />} label="Export SVG" size="sm" onClick={() => exportService.downloadAsSVG()} />
              <div className="mx-1 h-6 w-px bg-white/10" />
              <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5">
                <Hand className="h-3.5 w-3.5 text-white/40" />
                <span className="text-[10px] font-medium text-white/40">
                  {cameraReady && modelLoaded ? 'Pinch to write' : 'Draw with touch'}
                </span>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <AnimatePresence>{showUI && !showFallback && <Header />}</AnimatePresence>

      {/* Status text */}
      <AnimatePresence>
        {showUI && !isCelebrating && !showFallback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-6 left-4 z-20"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium uppercase tracking-widest text-white/20">
                {cameraReady && modelLoaded
                  ? isTracking
                    ? 'Pinch thumb + index finger to write'
                    : 'Show your hand to camera'
                  : cameraReady && !modelLoaded
                    ? 'AI model loading...'
                    : 'Initializing...'}
              </span>
              {performanceMetrics.fps > 0 && (
                <span className="text-[10px] text-white/10">
                  {performanceMetrics.fps} FPS | {strokes.length} strokes
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Birthday Celebration */}
      <BirthdayCelebration />

      {/* Particle background */}
      <ParticleEngine active={false} count={30} />

      {/* Toast notifications */}
      <ToastContainer />
    </main>
  );
}
