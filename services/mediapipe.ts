import { HandLandmarker, FilesetResolver, type NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { HandLandmarks, Point } from '@/lib/types';
import {
  MEDIAPIPE_NUM_HANDS,
  MEDIAPIPE_MIN_DETECTION_CONFIDENCE,
  MEDIAPIPE_MIN_PRESENCE_CONFIDENCE,
  MEDIAPIPE_MIN_TRACKING_CONFIDENCE,
  FINGER_TIP_INDEX,
  WRIST_INDEX,
  THUMB_TIP_INDEX,
  MIDDLE_TIP_INDEX,
  RING_TIP_INDEX,
  PINKY_TIP_INDEX,
} from '@/lib/constants';
import { logger } from './logger';

type MediaPipeCallback = (landmarks: HandLandmarks | null) => void;

class MediaPipeService {
  private handLandmarker: HandLandmarker | null = null;
  private isRunning = false;
  private callback: MediaPipeCallback | null = null;
  private animationFrameId: number | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private isLoaded = false;

  async initialize(): Promise<void> {
    if (this.isLoaded && this.handLandmarker) return;
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm',
      );

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: MEDIAPIPE_NUM_HANDS,
        minHandDetectionConfidence: MEDIAPIPE_MIN_DETECTION_CONFIDENCE,
        minHandPresenceConfidence: MEDIAPIPE_MIN_PRESENCE_CONFIDENCE,
        minTrackingConfidence: MEDIAPIPE_MIN_TRACKING_CONFIDENCE,
      });

      this.isLoaded = true;
      logger.info('MediaPipe Hand Landmarker loaded successfully');
    } catch (error) {
      logger.error('Failed to initialize MediaPipe', error);
      // Retry with CPU delegate
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm',
        );

        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: MEDIAPIPE_NUM_HANDS,
          minHandDetectionConfidence: MEDIAPIPE_MIN_DETECTION_CONFIDENCE,
          minHandPresenceConfidence: MEDIAPIPE_MIN_PRESENCE_CONFIDENCE,
          minTrackingConfidence: MEDIAPIPE_MIN_TRACKING_CONFIDENCE,
        });

        this.isLoaded = true;
        logger.info('MediaPipe Hand Landmarker loaded (CPU fallback)');
      } catch (retryError) {
        logger.error('Failed to initialize MediaPipe even with CPU fallback', retryError);
        throw retryError;
      }
    }
  }

  attachVideo(video: HTMLVideoElement): void {
    this.videoElement = video;
  }

  startDetection(callback: MediaPipeCallback): void {
    this.callback = callback;
    this.isRunning = true;
    this.detectLoop();
  }

  stopDetection(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private detectLoop(): void {
    if (!this.isRunning || !this.videoElement || !this.handLandmarker) return;

    const video = this.videoElement;
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      this.animationFrameId = requestAnimationFrame(() => this.detectLoop());
      return;
    }

    try {
      const result = this.handLandmarker.detectForVideo(video, performance.now());

      if (result.landmarks && result.landmarks.length > 0) {
        const landmarks = result.landmarks[0] as NormalizedLandmark[];
        const handedness = result.handedness?.[0]?.[0]?.categoryName ?? 'Right';

        const handLandmarks: HandLandmarks = {
          landmarks: landmarks.map((lm) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z ?? 0,
          })),
          handedness: handedness as 'Left' | 'Right',
          score: landmarks[0]?.visibility ?? 1,
        };

        this.callback?.(handLandmarks);
      } else {
        this.callback?.(null);
      }
    } catch (error) {
      logger.warn('Detection frame error', error);
      if (video.paused || video.ended || video.readyState < 2 || !video.srcObject) {
        this.isRunning = false;
        if (this.animationFrameId !== null) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
        }
        return;
      }
    }

    if (this.isRunning) {
      this.animationFrameId = requestAnimationFrame(() => this.detectLoop());
    }
  }

  getFingerTipPosition(
    landmarks: HandLandmarks,
    mirror: boolean = true,
  ): Point | null {
    const tip = landmarks.landmarks[FINGER_TIP_INDEX];
    if (!tip) return null;

    return {
      x: mirror ? 1 - tip.x : tip.x,
      y: tip.y,
      pressure: tip.z ? Math.max(0, 1 - Math.abs(tip.z)) : 0.5,
    };
  }

  getLandmarkPositions(
    landmarks: HandLandmarks,
    mirror: boolean = true,
  ): Point[] {
    return landmarks.landmarks.map((lm) => ({
      x: mirror ? 1 - lm.x : lm.x,
      y: lm.y,
      z: lm.z ?? 0,
    }));
  }

  getFingerDistance(
    landmarks: HandLandmarks,
    finger1: number,
    finger2: number,
  ): number {
    const p1 = landmarks.landmarks[finger1];
    const p2 = landmarks.landmarks[finger2];
    if (!p1 || !p2) return Infinity;
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + ((p1.z ?? 0) - (p2.z ?? 0)) ** 2);
  }

  isPinchGesture(landmarks: HandLandmarks, threshold: number = 0.05): boolean {
    const thumbTip = landmarks.landmarks[THUMB_TIP_INDEX];
    const indexTip = landmarks.landmarks[FINGER_TIP_INDEX];
    if (!thumbTip || !indexTip) return false;
    const dist = Math.sqrt((thumbTip.x - indexTip.x) ** 2 + (thumbTip.y - indexTip.y) ** 2);
    return dist < threshold;
  }

  private dist3d(a: { x: number; y: number; z?: number }, b: { x: number; y: number; z?: number }): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + ((a.z ?? 0) - (b.z ?? 0)) ** 2);
  }

  isPointingGesture(landmarks: HandLandmarks): boolean {
    const wrist = landmarks.landmarks[0];
    const indexTip = landmarks.landmarks[8];
    const indexMcp = landmarks.landmarks[5];
    const midTip = landmarks.landmarks[12];
    const midMcp = landmarks.landmarks[9];
    const ringTip = landmarks.landmarks[16];
    const ringMcp = landmarks.landmarks[13];
    const pinkyTip = landmarks.landmarks[20];
    const pinkyMcp = landmarks.landmarks[17];
    const thumbTip = landmarks.landmarks[4];
    const thumbMcp = landmarks.landmarks[2];

    if (!wrist || !indexTip || !indexMcp || !midTip || !midMcp) return false;

    const handSize = this.dist3d(wrist, midMcp);
    if (handSize < 0.01) return false;

    const indexExtended = this.dist3d(indexTip, indexMcp) > 0.3 * handSize;
    const middleCurled = !midTip || !midMcp || this.dist3d(midTip, midMcp) < 0.2 * handSize;
    const ringCurled = !ringTip || !ringMcp || this.dist3d(ringTip, ringMcp) < 0.2 * handSize;
    const pinkyCurled = !pinkyTip || !pinkyMcp || this.dist3d(pinkyTip, pinkyMcp) < 0.2 * handSize;
    const thumbCurled = !thumbTip || !thumbMcp || this.dist3d(thumbTip, thumbMcp) < 0.25 * handSize;

    return indexExtended && middleCurled && ringCurled && pinkyCurled && thumbCurled;
  }

  isOpenPalm(landmarks: HandLandmarks): boolean {
    const tips = [FINGER_TIP_INDEX, MIDDLE_TIP_INDEX, RING_TIP_INDEX, PINKY_TIP_INDEX];
    const wrist = landmarks.landmarks[WRIST_INDEX];
    if (!wrist) return false;

    const extended = tips.map((tip) => {
      const p = landmarks.landmarks[tip];
      if (!p) return false;
      return p.y < wrist.y - 0.1;
    });

    return extended.every(Boolean);
  }

  isFist(landmarks: HandLandmarks): boolean {
    const tips = [FINGER_TIP_INDEX, MIDDLE_TIP_INDEX, RING_TIP_INDEX, PINKY_TIP_INDEX];
    const wrist = landmarks.landmarks[WRIST_INDEX];
    if (!wrist) return false;

    const curled = tips.map((tip) => {
      const p = landmarks.landmarks[tip];
      if (!p) return false;
      return p.y > wrist.y;
    });

    return curled.filter(Boolean).length >= 3;
  }

  isThumbUp(landmarks: HandLandmarks): boolean {
    const thumbTip = landmarks.landmarks[THUMB_TIP_INDEX];
    const thumbIp = landmarks.landmarks[3];
    if (!thumbTip || !thumbIp) return false;
    const isExtended = thumbTip.x > thumbIp.x + 0.05;
    const isFistRest = this.isFist(landmarks);
    return isExtended && isFistRest;
  }

  isPeaceSign(landmarks: HandLandmarks): boolean {
    const indexTip = landmarks.landmarks[FINGER_TIP_INDEX];
    const middleTip = landmarks.landmarks[MIDDLE_TIP_INDEX];
    const ringTip = landmarks.landmarks[RING_TIP_INDEX];
    const pinkyTip = landmarks.landmarks[PINKY_TIP_INDEX];
    const palmBase = landmarks.landmarks[WRIST_INDEX];
    if (!indexTip || !middleTip || !ringTip || !pinkyTip || !palmBase) return false;

    const indexUp = indexTip.y < palmBase.y - 0.1;
    const middleUp = middleTip.y < palmBase.y - 0.1;
    const ringDown = ringTip.y > palmBase.y;
    const pinkyDown = pinkyTip.y > palmBase.y;

    return indexUp && middleUp && ringDown && pinkyDown;
  }

  countExtendedFingers(landmarks: HandLandmarks): number {
    const tips = [THUMB_TIP_INDEX, FINGER_TIP_INDEX, MIDDLE_TIP_INDEX, RING_TIP_INDEX, PINKY_TIP_INDEX];
    const wrist = landmarks.landmarks[WRIST_INDEX];
    if (!wrist) return 0;

    let count = 0;
    for (let i = 0; i < tips.length; i++) {
      const tip = landmarks.landmarks[tips[i]!];
      if (!tip) continue;
      if (i === 0) {
        const ip = landmarks.landmarks[3];
        if (ip && tip.x > ip.x + 0.03) count++;
      } else {
        if (tip.y < wrist.y - 0.1) count++;
      }
    }
    return count;
  }

  isLoadedCheck(): boolean {
    return this.isLoaded && this.handLandmarker !== null;
  }

  getHandLandmarker(): HandLandmarker | null {
    return this.handLandmarker;
  }

  cleanup(): void {
    this.stopDetection();
    this.handLandmarker?.close();
    this.handLandmarker = null;
    this.isLoaded = false;
    this.videoElement = null;
    logger.info('MediaPipe service cleaned up');
  }
}

export const mediapipeService = new MediaPipeService();
