import type { Settings } from './types';

export const defaultSettings: Settings = {
  brush: {
    style: 'neon',
    size: 3,
    color: '#3b82f6',
    opacity: 0.9,
    glow: 0.5,
    pressureSensitivity: true,
  },
  writing: {
    mode: 'pinch',
    smoothing: 0.7,
    predictionEnabled: true,
  },
  recognition: {
    confidenceThreshold: 0.6,
    continuousMode: true,
    autoCapitalize: true,
    spellCheck: true,
    dictionaryCorrection: true,
    language: 'en',
  },
  gestures: {
    pinchThreshold: 0.05,
    debounceTime: 200,
    cooldownTime: 500,
    gestureMapping: {
      pinch: 'start_writing',
      open_palm: 'clear',
      thumb_up: 'undo',
      peace: 'pause_recognition',
      three_fingers: 'screenshot',
      four_fingers: 'toggle_ui',
      five_fingers: 'reset',
      fist: 'none',
      pointing: 'none',
      none: 'none',
    },
  },
  animation: {
    quality: 'high',
    particleCount: 200,
    fireworksEnabled: true,
    confettiEnabled: true,
    balloonsEnabled: true,
    musicEnabled: true,
    soundEffectsEnabled: true,
  },
  theme: 'system',
  camera: {
    resolution: { width: 640, height: 480 },
    fps: 30,
    mirror: true,
    autoExposure: true,
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    largeText: false,
  },
  developer: {
    enabled: false,
    showFPS: false,
    showLandmarks: false,
    showConfidence: false,
    showPerformance: false,
  },
};

export function mergeSettings(saved: Partial<Settings> | null): Settings {
  if (!saved) return { ...defaultSettings };
  return {
    brush: { ...defaultSettings.brush, ...saved.brush },
    writing: { ...defaultSettings.writing, ...saved.writing },
    recognition: { ...defaultSettings.recognition, ...saved.recognition },
    gestures: { ...defaultSettings.gestures, ...saved.gestures },
    animation: { ...defaultSettings.animation, ...saved.animation },
    theme: saved.theme ?? defaultSettings.theme,
    camera: { ...defaultSettings.camera, ...saved.camera },
    accessibility: { ...defaultSettings.accessibility, ...saved.accessibility },
    developer: { ...defaultSettings.developer, ...saved.developer },
  };
}

export function getBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}
