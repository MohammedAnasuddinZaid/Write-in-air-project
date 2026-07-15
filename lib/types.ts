export interface Point {
  x: number;
  y: number;
  z?: number;
  pressure?: number;
  time?: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  opacity: number;
  smoothing: boolean;
  startTime: number;
  endTime?: number;
}

export interface HandLandmarks {
  landmarks: Point[];
  handedness: 'Left' | 'Right';
  score: number;
}

export interface TrackedFinger {
  position: Point;
  velocity: Point;
  acceleration: Point;
  isWriting: boolean;
  confidence: number;
}

export interface RecognitionResult {
  text: string;
  confidence: number;
  alternatives: Array<{ text: string; confidence: number }>;
  isComplete: boolean;
  timestamp: number;
}

export interface GestureResult {
  gesture: GestureType;
  confidence: number;
  hand: 'Left' | 'Right';
}

export type GestureType =
  | 'pinch'
  | 'open_palm'
  | 'thumb_up'
  | 'peace'
  | 'three_fingers'
  | 'four_fingers'
  | 'five_fingers'
  | 'fist'
  | 'pointing'
  | 'none';

export type BrushStyle =
  | 'neon'
  | 'ink'
  | 'pencil'
  | 'marker'
  | 'gold'
  | 'silver'
  | 'rainbow'
  | 'galaxy'
  | 'glass'
  | 'birthday'
  | 'magic';

export type WritingMode = 'pinch' | 'always' | 'hover' | 'toggle';

export type ThemeMode = 'dark' | 'light' | 'system';

export type CelebrationTheme =
  | 'classic'
  | 'kids'
  | 'elegant-gold'
  | 'minimal'
  | 'neon-party'
  | 'galaxy'
  | 'royal'
  | 'luxury'
  | 'candy'
  | 'pastel';

export type AnimationQuality = 'low' | 'medium' | 'high' | 'ultra';

export type RecognitionStatus = 'idle' | 'processing' | 'success' | 'error';

export type TrackingQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'none';

export interface CameraConfig {
  deviceId?: string;
  resolution: { width: number; height: number };
  fps: number;
  mirror: boolean;
  autoExposure: boolean;
}

export interface BrushConfig {
  style: BrushStyle;
  size: number;
  color: string;
  opacity: number;
  glow: number;
  pressureSensitivity: boolean;
}

export interface RecognitionConfig {
  confidenceThreshold: number;
  continuousMode: boolean;
  autoCapitalize: boolean;
  spellCheck: boolean;
  dictionaryCorrection: boolean;
  language: string;
}

export interface GestureConfig {
  pinchThreshold: number;
  debounceTime: number;
  cooldownTime: number;
  gestureMapping: Record<GestureType, string>;
}

export interface AnimationConfig {
  quality: AnimationQuality;
  particleCount: number;
  fireworksEnabled: boolean;
  confettiEnabled: boolean;
  balloonsEnabled: boolean;
  musicEnabled: boolean;
  soundEffectsEnabled: boolean;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  recognitionLatency: number;
  trackingConfidence: number;
  gestureConfidence: number;
  cpuUsage: number;
  memoryUsage: number;
  gpuAvailable: boolean;
}

export interface AppState {
  cameraReady: boolean;
  modelLoaded: boolean;
  isTracking: boolean;
  isWriting: boolean;
  isRecognizing: boolean;
  isCelebrating: boolean;
  currentText: string;
  recognizedText: string;
  statusMessage: string;
}

export interface Settings {
  brush: BrushConfig;
  writing: {
    mode: WritingMode;
    smoothing: number;
    predictionEnabled: boolean;
  };
  recognition: RecognitionConfig;
  gestures: GestureConfig;
  animation: AnimationConfig;
  theme: ThemeMode;
  camera: CameraConfig;
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    largeText: boolean;
  };
  developer: {
    enabled: boolean;
    showFPS: boolean;
    showLandmarks: boolean;
    showConfidence: boolean;
    showPerformance: boolean;
  };
}

export interface CelebrationEvent {
  type: 'birthday' | 'anniversary' | 'ramadan' | 'newyear' | 'congratulations' | 'welcome' | 'custom';
  text: string;
  customAnimation?: (timeline: unknown) => void;
}

export interface Particle {
  id: string;
  type: 'confetti' | 'star' | 'heart' | 'circle' | 'square' | 'sparkle' | 'smoke' | 'fire' | 'magic' | 'snow' | 'flower' | 'emoji' | 'glow';
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  lifetime: number;
  maxLifetime: number;
  gravity: number;
  wind: number;
  bounce: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration: number;
}

export interface SessionData {
  id: string;
  strokes: Stroke[];
  recognizedText: string;
  startTime: number;
  endTime: number;
  settings: Partial<Settings>;
}

export interface RecognitionHistory {
  id: string;
  text: string;
  confidence: number;
  timestamp: number;
  strokes: number;
}

declare global {
  interface Window {
    __RECOGNITION_WORKER?: Worker;
    __PARTICLE_WORKER?: Worker;
  }
}
