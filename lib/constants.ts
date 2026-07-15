export const APP_NAME = 'AirWriter AI';
export const APP_VERSION = '1.0.0';
export const APP_TAGLINE = 'Write in the air. Celebrate beautifully.';

export const FPS_TARGET = 60;
export const FPS_MINIMUM = 30;
export const FRAME_TIME_TARGET = 1000 / FPS_TARGET;

export const CAMERA_DEFAULT_RESOLUTION = { width: 1280, height: 720 };
export const CAMERA_MIN_RESOLUTION = { width: 320, height: 240 };
export const CAMERA_MAX_RESOLUTION = { width: 3840, height: 2160 };
export const CAMERA_DEFAULT_FPS = 30;

export const MEDIAPIPE_MODEL_PATH = '/models/hand_landmarker.task';
export const MEDIAPIPE_NUM_HANDS = 1;
export const MEDIAPIPE_MIN_DETECTION_CONFIDENCE = 0.5;
export const MEDIAPIPE_MIN_PRESENCE_CONFIDENCE = 0.5;
export const MEDIAPIPE_MIN_TRACKING_CONFIDENCE = 0.5;

export const FINGER_TIP_INDEX = 8;
export const FINGER_PIP_INDEX = 6;
export const FINGER_MCP_INDEX = 5;
export const WRIST_INDEX = 0;
export const THUMB_TIP_INDEX = 4;
export const THUMB_IP_INDEX = 3;
export const MIDDLE_TIP_INDEX = 12;
export const RING_TIP_INDEX = 16;
export const PINKY_TIP_INDEX = 20;

export const LANDMARK_COUNT = 21;

export const RECOGNITION_PAUSE_THRESHOLD = 800;
export const RECOGNITION_MIN_STROKE_LENGTH = 5;
export const RECOGNITION_CONFIDENCE_THRESHOLD = 0.6;
export const RECOGNITION_MAX_ALTERNATIVES = 5;
export const RECOGNITION_DEBOUNCE = 300;

export const GESTURE_PINCH_THRESHOLD = 0.05;
export const GESTURE_DEBOUNCE = 200;
export const GESTURE_COOLDOWN = 500;

export const SMOOTHING_WINDOW_SIZE = 5;
export const SMOOTHING_ONE_EURO_BETA = 0.04;
export const SMOOTHING_ONE_EURO_MIN_CUTOFF = 1.0;
export const SMOOTHING_ONE_EURO_DCUTOFF = 1.0;
export const SMOOTHING_KALMAN_Q = 0.01;
export const SMOOTHING_KALMAN_R = 0.1;

export const STROKE_MIN_POINTS = 3;
export const STROKE_MAX_POINTS = 10000;
export const STROKE_SIMPLIFICATION_TOLERANCE = 2;
export const STROKE_DEFAULT_WIDTH = 3;
export const STROKE_MIN_WIDTH = 1;
export const STROKE_MAX_WIDTH = 20;
export const STROKE_DEFAULT_COLOR = '#3b82f6';
export const STROKE_DEFAULT_OPACITY = 0.9;
export const STROKE_CAP_ROUND = true;
export const STROKE_JOIN_ROUND = true;

export const PARTICLE_MAX_COUNT_HIGH = 500;
export const PARTICLE_MAX_COUNT_MEDIUM = 200;
export const PARTICLE_MAX_COUNT_LOW = 50;
export const PARTICLE_MAX_COUNT_ULTRA = 1000;
export const PARTICLE_DEFAULT_GRAVITY = 0.1;
export const PARTICLE_DEFAULT_WIND = 0.02;
export const PARTICLE_DEFAULT_LIFETIME = 3000;

export const CANVAS_WRITING_SCALE = 1.0;
export const CANVAS_PREVIEW_SCALE = 0.8;
export const getCanvasDPI = () => (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

export const DEFAULT_SETTINGS_KEY = 'airwriter-settings';
export const DEFAULT_RECOGNITION_HISTORY_KEY = 'airwriter-history';
export const DEFAULT_SESSION_KEY = 'airwriter-session';

export const SUPPORTED_PHRASES = [
  'HAPPY BIRTHDAY',
  'HAPPY ANNIVERSARY',
  'HAPPY RAMADAN',
  'HAPPY NEW YEAR',
  'CONGRATULATIONS',
  'WELCOME',
  'THANK YOU',
  'GOOD LUCK',
  'BEST WISHES',
] as const;

export const THEME_STORAGE_KEY = 'airwriter-theme';

export const COLORS = {
  primary: '#3b82f6',
  secondary: '#22c55e',
  accent: '#d946ef',
  birthday: {
    gold: '#fbbf24',
    pink: '#f472b6',
    purple: '#a855f7',
    blue: '#60a5fa',
    green: '#34d399',
    red: '#f87171',
    orange: '#fb923c',
    yellow: '#facc15',
    cream: '#fef3c7',
    white: '#ffffff',
  },
  dark: {
    bg: '#0a0a0f',
    surface: '#12121a',
    card: '#1a1a2e',
    border: '#2a2a3e',
    text: '#f1f5f9',
    muted: '#94a3b8',
  },
  light: {
    bg: '#f8fafc',
    surface: '#ffffff',
    card: '#f1f5f9',
    border: '#e2e8f0',
    text: '#0f172a',
    muted: '#64748b',
  },
} as const;

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;
