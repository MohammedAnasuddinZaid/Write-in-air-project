import type { HandLandmarks, GestureResult, GestureType, GestureConfig } from '@/lib/types';
import { mediapipeService } from './mediapipe';
import { logger } from './logger';

class GestureService {
  private lastGesture: GestureType = 'none';
  private lastGestureTime = 0;
  private gestureCooldown = 500;
  private debounceTime = 200;
  private config: GestureConfig = {
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
  };
  private gestureCallbacks: Map<string, () => void> = new Map();
  private confidenceHistory: number[] = [];

  updateConfig(config: Partial<GestureConfig>): void {
    this.config = { ...this.config, ...config };
    this.gestureCooldown = config.cooldownTime ?? this.gestureCooldown;
    this.debounceTime = config.debounceTime ?? this.debounceTime;
  }

  detectGesture(landmarks: HandLandmarks): GestureResult {
    const now = Date.now();
    let gesture: GestureType = 'none';
    let confidence = 0;

    if (mediapipeService.isPinchGesture(landmarks, this.config.pinchThreshold)) {
      gesture = 'pinch';
      confidence = 0.95;
    } else if (mediapipeService.isThumbUp(landmarks)) {
      gesture = 'thumb_up';
      confidence = 0.9;
    } else if (mediapipeService.isPeaceSign(landmarks)) {
      gesture = 'peace';
      confidence = 0.85;
    } else if (mediapipeService.isOpenPalm(landmarks)) {
      gesture = 'open_palm';
      confidence = 0.9;
    } else if (mediapipeService.isFist(landmarks)) {
      gesture = 'fist';
      confidence = 0.8;
    } else {
      const extendedCount = mediapipeService.countExtendedFingers(landmarks);
      if (extendedCount === 3) {
        gesture = 'three_fingers';
        confidence = 0.75;
      } else if (extendedCount === 4) {
        gesture = 'four_fingers';
        confidence = 0.75;
      } else if (extendedCount === 5) {
        gesture = 'five_fingers';
        confidence = 0.8;
      }
    }

    this.confidenceHistory.push(confidence);
    if (this.confidenceHistory.length > 10) this.confidenceHistory.shift();

    const avgConfidence =
      this.confidenceHistory.reduce((a, b) => a + b, 0) /
      Math.max(this.confidenceHistory.length, 1);

    const result: GestureResult = {
      gesture,
      confidence: avgConfidence,
      hand: landmarks.handedness,
    };

    if (gesture !== 'none' && gesture !== this.lastGesture) {
      const timeSinceLast = now - this.lastGestureTime;
      if (timeSinceLast >= this.gestureCooldown) {
        this.lastGesture = gesture;
        this.lastGestureTime = now;
        this.executeGestureAction(gesture);
        logger.info(`Gesture detected: ${gesture} (confidence: ${avgConfidence.toFixed(2)})`);
      }
    }

    return result;
  }

  onGesture(gesture: GestureType, callback: () => void): void {
    this.gestureCallbacks.set(gesture, callback);
  }

  offGesture(gesture: GestureType): void {
    this.gestureCallbacks.delete(gesture);
  }

  private executeGestureAction(gesture: GestureType): void {
    const callback = this.gestureCallbacks.get(gesture);
    if (callback) {
      callback();
    }
  }

  getLastGesture(): GestureType {
    return this.lastGesture;
  }

  getGestureAction(gesture: GestureType): string {
    return this.config.gestureMapping[gesture] ?? 'none';
  }

  getGestureName(gesture: GestureType): string {
    const names: Record<GestureType, string> = {
      pinch: 'Pinch',
      open_palm: 'Open Palm',
      thumb_up: 'Thumb Up',
      peace: 'Peace Sign',
      three_fingers: 'Three Fingers',
      four_fingers: 'Four Fingers',
      five_fingers: 'Five Fingers',
      fist: 'Fist',
      pointing: 'Pointing',
      none: 'None',
    };
    return names[gesture] ?? 'Unknown';
  }

  reset(): void {
    this.lastGesture = 'none';
    this.lastGestureTime = 0;
    this.confidenceHistory = [];
  }
}

export const gestureService = new GestureService();
