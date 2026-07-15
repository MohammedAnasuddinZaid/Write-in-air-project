'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Undo2, Redo2, Trash2, Camera, Pen, Hand, Download,
  RefreshCw, AlertTriangle,
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
import { useRecognitionStore } from '@/stores/useRecognitionStore';
import { recognitionService } from '@/services/recognition';
import { drawingService } from '@/services/drawing';
import { audioService } from '@/services/audio';
import { exportService } from '@/services/export';
import { mediapipeService } from '@/services/mediapipe';
import { smoothingFilter } from '@/services/smoothing';
import { letterRecognizer } from '@/services/letterRecognizer';
import type { Point, HandLandmarks } from '@/lib/types';
import { SUPPORTED_PHRASES } from '@/lib/constants';

const PAUSE_SPEED_THRESHOLD = 30;
const SEGMENT_PAUSE_MS = 200;
const ACCUMULATION_MS = 400;

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
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);

  const { canvasRef, beginStroke, continueStroke, endStroke, clearCanvas, undo, redo, renderFrame } = useCanvas();
  const { setupDefaultGestures } = useGesture();
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

  const recognizedText = useRecognitionStore((s) => s.recognizedText);
  const setRecognizedText = useRecognitionStore((s) => s.setRecognizedText);

  const touchWritingRef = useRef(false);
  const touchStrokeRef = useRef<Point[]>([]);
  const gestureWritingRef = useRef(false);
  const segmentBufferRef = useRef<Point[]>([]);
  const pendingStrokesRef = useRef<Point[][]>([]);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const letterTextRef = useRef('');
  const fingerPosRef = useRef<Point | null>(null);
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
        y: 50 + Math.random() * 40,
      });
    }
    setFloatingEmojis((prev) => [...prev, ...newEmojis]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => !newEmojis.find((n) => n.id === e.id)));
    }, 3000);
  }, []);

  const checkPhrases = useCallback((text: string) => {
    const fullText = text.toUpperCase();
    for (const phrase of SUPPORTED_PHRASES) {
      if (fullText.includes(phrase)) {
        letterTextRef.current = '';
        setCelebrationPhrase(phrase);
        setIsCelebrating(true);
        addToast({
          type: 'success',
          message: `🎉 ${phrase}!`,
          duration: 4000,
        });
        if (phrase.includes('HAPPY')) spawnEmojis('😊', 8);
        if (phrase.includes('BIRTHDAY')) {
          spawnEmojis('🎂', 6);
          setTimeout(() => spawnEmojis('🎉', 10), 500);
          setTimeout(() => spawnEmojis('🎈', 8), 1000);
        }
        if (phrase.includes('RAMADAN')) spawnEmojis('🌙', 8);
        if (phrase.includes('NEW YEAR')) spawnEmojis('🎆', 10);
        if (phrase.includes('CONGRATULATIONS') || phrase.includes('WELCOME')) spawnEmojis('🎉', 8);
        break;
      }
    }
  }, [setCelebrationPhrase, setIsCelebrating, addToast, spawnEmojis]);

  const recognizeLetter = useCallback((strokes: Point[][]) => {
    if (strokes.length === 0) return;
    const combined: Point[] = [];
    for (let i = 0; i < strokes.length; i++) {
      if (i > 0) combined.push({ x: -10, y: -10 });
      const s = strokes[i];
      if (s) combined.push(...s);
    }
    if (combined.length < 5) return;
    const letter = letterRecognizer.recognizeFromStroke(combined);
    if (letter) {
      letterTextRef.current += letter;
      setRecognizedText(letterTextRef.current);
      checkPhrases(letterTextRef.current);
    }
  }, [setRecognizedText, checkPhrases]);

  const finalizeSegment = useCallback(() => {
    if (segmentBufferRef.current.length > 0) {
      pendingStrokesRef.current.push([...segmentBufferRef.current]);
      segmentBufferRef.current = [];
    }
    if (accumTimerRef.current) clearTimeout(accumTimerRef.current);
    accumTimerRef.current = setTimeout(() => {
      const strokes = [...pendingStrokesRef.current];
      pendingStrokesRef.current = [];
      recognizeLetter(strokes);
    }, ACCUMULATION_MS);
  }, [recognizeLetter]);

  const cancelTimers = useCallback(() => {
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    if (accumTimerRef.current) {
      clearTimeout(accumTimerRef.current);
      accumTimerRef.current = null;
    }
  }, []);

  const endWritingSession = useCallback(() => {
    if (!gestureWritingRef.current) return;
    cancelTimers();
    if (segmentBufferRef.current.length > 0) {
      pendingStrokesRef.current.push([...segmentBufferRef.current]);
      segmentBufferRef.current = [];
    }
    if (pendingStrokesRef.current.length > 0) {
      const strokes = [...pendingStrokesRef.current];
      pendingStrokesRef.current = [];
      recognizeLetter(strokes);
    }
    gestureWritingRef.current = false;
    canvasActionsRef.current.endStroke();
    smoothingFilter.reset();
  }, [cancelTimers, recognizeLetter]);

  useMediaPipe({
    videoElement: videoReady,
    autoStart: true,
    onLandmarks: useCallback((landmarks: HandLandmarks | null) => {
      if (!landmarks) {
        endWritingSession();
        fingerPosRef.current = null;
        return;
      }

      const pointing = mediapipeService.isPointingGesture(landmarks);
      const pinching = mediapipeService.isPinchGesture(landmarks);
      const shouldWrite = pointing || pinching;
      const tip = mediapipeService.getFingerTipPosition(landmarks, true);
      if (!tip) {
        endWritingSession();
        fingerPosRef.current = null;
        return;
      }

      const rawX = tip.x * window.innerWidth;
      const rawY = tip.y * window.innerHeight;
      const smoothed = smoothingFilter.smooth(rawX, rawY);
      const sp: Point = { x: smoothed.x, y: smoothed.y, pressure: tip.pressure ?? 0.5, time: Date.now() };

      fingerPosRef.current = sp;

      if (shouldWrite) {
        segmentBufferRef.current.push(sp);
        if (!gestureWritingRef.current) {
          canvasActionsRef.current.beginStroke(sp, { style: 'gold', color: '#FFD700', size: 4, opacity: 0.95, glow: 0.8, pressureSensitivity: true });
          gestureWritingRef.current = true;
        } else {
          canvasActionsRef.current.continueStroke(sp, { style: 'gold', color: '#FFD700', size: 4, opacity: 0.95, glow: 0.8, pressureSensitivity: true });
        }

        if (smoothed.speed < PAUSE_SPEED_THRESHOLD) {
          if (!pauseTimerRef.current) {
            pauseTimerRef.current = setTimeout(() => {
              pauseTimerRef.current = null;
              finalizeSegment();
            }, SEGMENT_PAUSE_MS);
          }
        } else {
          if (pauseTimerRef.current) {
            clearTimeout(pauseTimerRef.current);
            pauseTimerRef.current = null;
          }
        }
      } else if (gestureWritingRef.current) {
        endWritingSession();
      }
    }, [endWritingSession, finalizeSegment]),
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
        addToast({ type: 'warning', message: 'Loading timed out. Touch/mouse input still works.', duration: 6000 });
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

  const handleClear = useCallback(() => {
    clearCanvas();
    drawingService.clear();
    letterTextRef.current = '';
    setRecognizedText('');
    recognitionService.clear();
    cancelTimers();
    pendingStrokesRef.current = [];
    segmentBufferRef.current = [];
    audioService.playClick();
  }, [clearCanvas, setRecognizedText, cancelTimers]);

  const handleUndo = useCallback(() => {
    undo();
    const removed = drawingService.undo();
    if (removed) {
      letterTextRef.current = letterTextRef.current.slice(0, -1);
      setRecognizedText(letterTextRef.current);
      audioService.playClick();
    }
  }, [undo, setRecognizedText]);

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
    letterTextRef.current = '';
    setRecognizedText('');
    recognitionService.clear();
    cancelTimers();
    pendingStrokesRef.current = [];
    segmentBufferRef.current = [];
    setStatusMessage('Reset complete');
    addToast({ type: 'info', message: 'Reset complete', duration: 1500 });
  }, [clearCanvas, setRecognizedText, cancelTimers, setStatusMessage, addToast]);

  const handleToggleUI = useCallback(() => {
    setShowUI((prev) => !prev);
  }, []);

  useEffect(() => {
    const cleanup = setupDefaultGestures({
      onClear: handleClear,
      onUndo: handleUndo,
      onScreenshot: handleScreenshot,
      onToggleUI: handleToggleUI,
      onReset: handleReset,
      onPauseRecognition: () => {},
    });
    return cleanup;
  }, [setupDefaultGestures, handleClear, handleUndo, handleScreenshot, handleToggleUI, handleReset]);

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
      const x = touch.clientX;
      const y = touch.clientY;
      if (x >= 0 && y >= 0) {
        beginStroke({ x, y, pressure: 0.5, time: Date.now() }, { style: 'gold', color: '#FFD700', size: 4, opacity: 0.95, glow: 0.8, pressureSensitivity: true });
        touchWritingRef.current = true;
      }
    },
    [beginStroke],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch || !touchWritingRef.current) return;
      const x = touch.clientX;
      const y = touch.clientY;
      const pt: Point = { x, y, pressure: 0.5, time: Date.now() };
      touchStrokeRef.current.push(pt);
      continueStroke(pt, { style: 'gold', color: '#FFD700', size: 4, opacity: 0.95, glow: 0.8, pressureSensitivity: true });
    },
    [continueStroke],
  );

  const handleTouchEnd = useCallback(() => {
    if (touchWritingRef.current) {
      touchWritingRef.current = false;
      const stroke = endStroke();
      if (stroke) {
        const pts = [...touchStrokeRef.current];
        touchStrokeRef.current = [];
        if (pts.length >= 5) {
          smoothingFilter.reset();
          pendingStrokesRef.current.push(pts);
          if (accumTimerRef.current) clearTimeout(accumTimerRef.current);
          accumTimerRef.current = setTimeout(() => {
            const strokes = [...pendingStrokesRef.current];
            pendingStrokesRef.current = [];
            const combined: Point[] = [];
            for (let i = 0; i < strokes.length; i++) {
              if (i > 0) combined.push({ x: -10, y: -10 });
              const s = strokes[i];
              if (s) combined.push(...s);
            }
            const letter = letterRecognizer.recognizeFromStroke(combined);
            if (letter) {
              letterTextRef.current += letter;
              setRecognizedText(letterTextRef.current);
              checkPhrases(letterTextRef.current);
            }
          }, ACCUMULATION_MS);
        }
      }
    }
  }, [endStroke, setRecognizedText, checkPhrases]);

  const showSplash = !cameraReady || (!modelLoaded && !cameraError && !modelError && !initTimedOut);
  const showFallback = (!cameraReady && cameraError) || initTimedOut || modelError;

  const textToShow = letterTextRef.current || recognizedText;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <CameraFeed onVideoReady={onVideoReady} onError={handleCameraError} fullscreen />

      <AnimatePresence>
        {showSplash && !showFallback && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f]"
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

      <AnimatePresence>
        {showFallback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f]/90 backdrop-blur-sm"
          >
            <GlassPanel blur="xl" opacity="heavy" className="flex max-w-md flex-col items-center gap-6 px-10 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/20">
                <AlertTriangle className="h-8 w-8 text-yellow-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Camera Required</h2>
              <p className="text-sm leading-relaxed text-white/60">
                {cameraError ? `Camera error: ${cameraError}` : modelError ? `AI model unavailable: ${modelError}` : 'Camera access or AI model loading timed out.'}
                <br />
                Touch and mouse drawing still works without the camera.
              </p>
              <div className="flex gap-3">
                <Button variant="primary" onClick={handleRetryCamera} icon={<RefreshCw className="h-4 w-4" />}>
                  Retry
                </Button>
                <Button variant="secondary" onClick={() => {
                  setCameraReady(true);
                  setInitTimedOut(false);
                  setModelError(null);
                  setCameraError(null);
                  setStatusMessage('Camera skipped — touch/mouse mode');
                  addToast({ type: 'info', message: 'Using touch/mouse mode. Camera tracking disabled.', duration: 3000 });
                }}>
                  Continue Without Camera
                </Button>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="fixed inset-0 z-10"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <DrawingCanvas fingerPosRef={fingerPosRef} />
      </div>

      {textToShow && (
        <motion.div
          key={textToShow}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 left-1/2 z-20 -translate-x-1/2"
        >
          <GlassPanel blur="xl" opacity="heavy" className="px-8 py-4">
            <p className="text-center text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-400 drop-shadow-lg">
              {textToShow}
            </p>
          </GlassPanel>
        </motion.div>
      )}

      {gestureWritingRef.current && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="pointer-events-none fixed left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="h-5 w-5 animate-pulse rounded-full bg-yellow-400/60 shadow-lg shadow-yellow-400/40" />
        </motion.div>
      )}

      <AnimatePresence>
        {showUI && !showFallback && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2"
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
                  {cameraReady && modelLoaded ? 'Pinch or point to write' : 'Draw with touch'}
                </span>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{showUI && !showFallback && <Header />}</AnimatePresence>

      <AnimatePresence>
        {showUI && !isCelebrating && !showFallback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-4 z-20"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium uppercase tracking-widest text-white/20">
                {cameraReady && modelLoaded
                  ? isTracking
                    ? 'Pinch or point index finger to write'
                    : 'Show your hand to camera'
                  : cameraReady && !modelLoaded
                    ? 'AI model loading...'
                    : 'Initializing...'}
              </span>
              {performanceMetrics.fps > 0 && (
                <span className="text-[10px] text-white/10">
                  {performanceMetrics.fps} FPS | {drawingService.getStrokeCount()} strokes
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BirthdayCelebration />
      <ParticleEngine active={false} count={30} />
      <ToastContainer />
    </main>
  );
}
